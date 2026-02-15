// Task CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import { SITE_CONFIG } from "./site-config"

import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource } from "@/types"

interface TaskRow {
  id: string
  name: string
  description: string
  status: string
  priority: string
  category: string
  dueDate: string | null
  source: string
  goalId: string | null
  createdAt: string
  updatedAt: string
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    category: row.category as TaskCategory,
    dueDate: row.dueDate || undefined,
    source: row.source as TaskSource,
    goalId: row.goalId || "general",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Returns current week's Sunday-to-Sunday bounds in local timezone */
export function getWeekBounds(): { start: string; end: string } {
  const now = new Date()
  const local = new Date(now.getTime() + SITE_CONFIG.utcOffsetHours * 60 * 60 * 1000)
  const day = local.getUTCDay()
  const startOfWeek = new Date(local)
  startOfWeek.setUTCDate(local.getUTCDate() - day)
  startOfWeek.setUTCHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7)
  return { start: startOfWeek.toISOString().slice(0, 10), end: endOfWeek.toISOString().slice(0, 10) }
}

/** Validates that a task can be moved to "To Do This Week" */
export function validateWeekStatus(dueDate: string | null | undefined): string | null {
  if (!dueDate) return "Task must have a due date to be scheduled for this week"
  const { start, end } = getWeekBounds()
  if (dueDate < start || dueDate >= end) return `Due date must be within this week (${start} to ${end})`
  return null
}

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
  goalId?: string
}): Task {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO tasks (id, name, description, status, priority, category, dueDate, source, goalId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.description || "",
    input.status || "Backlog",
    input.priority || "Medium",
    input.category || "Personal",
    input.dueDate || null,
    input.source || "Manual",
    input.goalId || "general",
    now,
    now
  )

  const task = rowToTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow)
  logActivity({ entityType: "task", entityId: id, entityName: input.name, action: "created" })
  return task
}

export function updateTaskStatus(id: string, status: TaskStatus): { error?: string } {
  const db = getDb()
  const old = db.prepare("SELECT name, status, dueDate FROM tasks WHERE id = ?").get(id) as
    { name: string; status: string; dueDate: string | null } | undefined

  if (status === "To Do This Week") {
    const weekError = validateWeekStatus(old?.dueDate)
    if (weekError) return { error: weekError }
  }

  const now = new Date().toISOString()
  db.prepare("UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?").run(status, now, id)
  logActivity({
    entityType: "task", entityId: id, entityName: old?.name || "Unknown",
    action: "status_changed", detail: `Status: ${old?.status || "?"} → ${status}`,
  })
  return {}
}

export function updateTask(
  id: string,
  updates: Partial<Pick<Task, "name" | "description" | "status" | "priority" | "category" | "dueDate" | "goalId">>
): Task | null | { error: string } {
  const db = getDb()
  const oldRow = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined

  if (updates.status === "To Do This Week") {
    const dueDate = updates.dueDate !== undefined ? (updates.dueDate || null) : (oldRow?.dueDate || null)
    const weekError = validateWeekStatus(dueDate)
    if (weekError) return { error: weekError }
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

export function getTaskStats(category?: string): {
  total: number; thisWeek: number; today: number; inProgress: number; completionPercent: number
} {
  const db = getDb()
  const where = category ? "WHERE category = ?" : "WHERE 1=1"
  const params = category ? [category] : []

  const total = (db.prepare(`SELECT COUNT(*) as c FROM tasks ${where} AND status != 'Archived'`).get(...params) as { c: number }).c
  const completed = (db.prepare(`SELECT COUNT(*) as c FROM tasks ${where} AND status = 'Completed'`).get(...params) as { c: number }).c
  const inProgress = (db.prepare(`SELECT COUNT(*) as c FROM tasks ${where} AND status = 'In Progress'`).get(...params) as { c: number }).c

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const weekStr = startOfWeek.toISOString().slice(0, 10)

  const today = (db.prepare(`SELECT COUNT(*) as c FROM tasks ${where} AND createdAt >= ?`).get(...[...params, todayStr]) as { c: number }).c
  const thisWeek = (db.prepare(`SELECT COUNT(*) as c FROM tasks ${where} AND createdAt >= ?`).get(...[...params, weekStr]) as { c: number }).c
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, thisWeek, today, inProgress, completionPercent }
}
