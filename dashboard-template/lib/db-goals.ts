// Goal CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Goal, GoalStatus, GoalCategory } from "@/types"

interface GoalRow {
  id: string
  name: string
  description: string
  status: string
  category: string
  targetDate: string | null
  progress: number
  metric: string
  currentValue: string
  targetValue: string
  priority: string
  createdAt: string
  updatedAt: string
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    status: row.status as GoalStatus,
    category: row.category as GoalCategory,
    targetDate: row.targetDate || undefined,
    progress: row.progress,
    metric: row.metric || "",
    currentValue: row.currentValue || "",
    targetValue: row.targetValue || "",
    priority: row.priority as "High" | "Medium" | "Low",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function getGoals(): Goal[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT * FROM goals ORDER BY
       CASE status WHEN 'Active' THEN 0 WHEN 'Paused' THEN 1 ELSE 2 END,
       CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END`
    )
    .all() as GoalRow[]
  return rows.map(rowToGoal)
}

export function getGoal(id: string): Goal | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as GoalRow | undefined
  return row ? rowToGoal(row) : null
}

export function createGoal(input: {
  name: string
  description?: string
  status?: GoalStatus
  category?: GoalCategory
  targetDate?: string
  metric?: string
  targetValue?: string
  priority?: string
}): Goal {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO goals (id, name, description, status, category, targetDate, progress, metric, currentValue, targetValue, priority, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, '', ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.description || "",
    input.status || "Active",
    input.category || "Personal",
    input.targetDate || null,
    input.metric || "",
    input.targetValue || "",
    input.priority || "Medium",
    now,
    now
  )

  const goal = rowToGoal(db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as GoalRow)
  logActivity({ entityType: "goal", entityId: id, entityName: input.name, action: "created" })
  return goal
}

export function updateGoal(
  id: string,
  updates: Partial<Omit<Goal, "id" | "createdAt" | "updatedAt">>
): Goal | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | number | null)[] = [now]

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name) }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description) }
  if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status) }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category) }
  if (updates.targetDate !== undefined) { fields.push("targetDate = ?"); values.push(updates.targetDate || null) }
  if (updates.progress !== undefined) { fields.push("progress = ?"); values.push(updates.progress) }
  if (updates.metric !== undefined) { fields.push("metric = ?"); values.push(updates.metric) }
  if (updates.currentValue !== undefined) { fields.push("currentValue = ?"); values.push(updates.currentValue) }
  if (updates.targetValue !== undefined) { fields.push("targetValue = ?"); values.push(updates.targetValue) }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority) }

  const oldRow = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as GoalRow | undefined
  values.push(id)
  db.prepare(`UPDATE goals SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as GoalRow | undefined
  if (row && oldRow) {
    const changes: Record<string, [unknown, unknown]> = {}
    for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
      const oldVal = oldRow[key as keyof GoalRow]
      const newVal = row[key as keyof GoalRow]
      if (oldVal !== newVal) changes[key] = [oldVal, newVal]
    }
    if (Object.keys(changes).length > 0) {
      logActivity({ entityType: "goal", entityId: id, entityName: row.name, action: "updated", changes })
    }
  }
  return row ? rowToGoal(row) : null
}

export function deleteGoal(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT name FROM goals WHERE id = ?").get(id) as { name: string } | undefined
  // Move tasks to General before deleting
  db.prepare("UPDATE tasks SET goalId = 'general' WHERE goalId = ?").run(id)
  db.prepare("DELETE FROM goals WHERE id = ?").run(id)
  logActivity({ entityType: "goal", entityId: id, entityName: row?.name || "Unknown", action: "deleted" })
}
