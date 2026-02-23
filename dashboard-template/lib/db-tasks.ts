// Task CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import { rowToTask, autoAssigneeForStatus, validateWeekStatus } from "./db-task-automation"
import type { TaskRow } from "./db-task-automation"

import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource, TaskComplexity, TaskAssignee } from "@/types"

// Re-export everything from automation so consumers importing from db-tasks still work
export {
  type TaskRow, rowToTask, autoAssigneeForStatus, getWeekBounds, validateWeekStatus,
  getTaskStats, getSchedulingData, priorityScore, sumEstimatedMinutes,
} from "./db-task-automation"

export function getTasks(goalId?: string): Task[] {
  const db = getDb()
  if (goalId) {
    const rows = db
      .prepare(
        `SELECT * FROM tasks WHERE status != 'Archived' AND goalId = ?
         ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END,
         dueDate ASC NULLS LAST`
      )
      .all(goalId) as TaskRow[]
    return rows.map(rowToTask)
  }

  const rows = db
    .prepare(
      `SELECT * FROM tasks WHERE status != 'Archived'
       ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END,
       dueDate ASC NULLS LAST`
    )
    .all() as TaskRow[]
  return rows.map(rowToTask)
}

export function createTask(input: {
  name: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  category?: TaskCategory
  dueDate?: string
  source?: TaskSource
  complexity?: TaskComplexity
  estimatedMinutes?: number
  assignee?: TaskAssignee
  goalId?: string
}): Task {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()
  const status = input.status || "Backlog"
  const assignee = input.assignee || autoAssigneeForStatus(status as TaskStatus) || null

  db.prepare(
    `INSERT INTO tasks (id, name, description, status, priority, category, dueDate, source, complexity, estimatedMinutes, assignee, goalId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, input.name, input.description || "", status, input.priority || "Medium",
    input.category || "Personal", input.dueDate || null, input.source || "Manual",
    input.complexity || "Moderate", input.estimatedMinutes || null, assignee,
    input.goalId || "general", now, now
  )

  const task = rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow)
  logActivity({ entityType: "task", entityId: id, entityName: input.name, action: "created" })
  return task
}

export function updateTaskStatus(id: string, status: TaskStatus): { error?: string } {
  const db = getDb()
  const old = db.prepare("SELECT name, status, dueDate, assignee FROM tasks WHERE id = ?").get(id) as
    { name: string; status: string; dueDate: string | null; assignee: string | null } | undefined

  if (status === "To Do This Week") {
    const weekError = validateWeekStatus(old?.dueDate)
    if (weekError) return { error: weekError }
  }

  const now = new Date().toISOString()
  const newAssignee = autoAssigneeForStatus(status)
  if (newAssignee) {
    db.prepare("UPDATE tasks SET status = ?, assignee = ?, updatedAt = ? WHERE id = ?").run(status, newAssignee, now, id)
  } else {
    db.prepare("UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?").run(status, now, id)
  }
  logActivity({
    entityType: "task", entityId: id, entityName: old?.name || "Unknown",
    action: "status_changed", detail: `Status: ${old?.status || "?"} → ${status}`,
  })
  return {}
}

export function updateTask(
  id: string,
  updates: Partial<Pick<Task, "name" | "description" | "status" | "priority" | "category" | "dueDate" | "goalId" | "complexity" | "estimatedMinutes" | "assignee">>
): Task | null | { error: string } {
  const db = getDb()
  const oldRow = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined

  if (updates.status === "To Do This Week") {
    const dueDate = updates.dueDate !== undefined ? (updates.dueDate || null) : (oldRow?.dueDate || null)
    const weekError = validateWeekStatus(dueDate)
    if (weekError) return { error: weekError }
  }

  // Auto-assign on status change (unless explicit assignee provided)
  if (updates.status && updates.assignee === undefined) {
    const auto = autoAssigneeForStatus(updates.status)
    if (auto) updates.assignee = auto
  }

  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | null)[] = [now]

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name) }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description) }
  if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status) }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority) }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category) }
  if (updates.dueDate !== undefined) { fields.push("dueDate = ?"); values.push(updates.dueDate || null) }
  if (updates.goalId !== undefined) { fields.push("goalId = ?"); values.push(updates.goalId) }
  if (updates.complexity !== undefined) { fields.push("complexity = ?"); values.push(updates.complexity) }
  if (updates.estimatedMinutes !== undefined) { fields.push("estimatedMinutes = ?"); values.push(String(updates.estimatedMinutes)) }
  if (updates.assignee !== undefined) { fields.push("assignee = ?"); values.push(updates.assignee || null) }

  values.push(id)
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined
  if (row && oldRow) {
    const changes: Record<string, [unknown, unknown]> = {}
    for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
      const oldVal = oldRow[key as keyof TaskRow]
      const newVal = row[key as keyof TaskRow]
      if (oldVal !== newVal) changes[key] = [oldVal, newVal]
    }
    if (Object.keys(changes).length > 0) {
      logActivity({
        entityType: "task", entityId: id, entityName: row.name,
        action: updates.status && updates.status !== oldRow.status ? "status_changed" : "updated",
        detail: updates.status && updates.status !== oldRow.status ? `Status: ${oldRow.status} → ${updates.status}` : "Task updated",
        changes,
      })
    }
  }
  return row ? rowToTask(row) : null
}

export function deleteTask(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT name FROM tasks WHERE id = ?").get(id) as { name: string } | undefined
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id)
  logActivity({ entityType: "task", entityId: id, entityName: row?.name || "Unknown", action: "deleted" })
}
