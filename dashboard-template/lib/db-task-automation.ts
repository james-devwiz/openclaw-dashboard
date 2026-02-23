// Task scheduling, automation, analytics helpers, and shared row mapping
// Extracted from db-tasks.ts to respect 200-line limit

import { getDb } from "./db"
import { AI_ASSIGNEE_STATUSES, USER_ASSIGNEE_STATUSES } from "@/lib/task-constants"

import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource, TaskComplexity, TaskAssignee } from "@/types"

export interface TaskRow {
  id: string
  name: string
  description: string
  status: string
  priority: string
  category: string
  dueDate: string | null
  source: string
  complexity: string | null
  estimatedMinutes: number | null
  assignee: string | null
  goalId: string | null
  createdAt: string
  updatedAt: string
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    category: row.category as TaskCategory,
    dueDate: row.dueDate || undefined,
    source: row.source as TaskSource,
    complexity: (row.complexity as TaskComplexity) || "Moderate",
    estimatedMinutes: row.estimatedMinutes || undefined,
    assignee: (row.assignee as TaskAssignee) || undefined,
    goalId: row.goalId || "general",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Returns the auto-assignee for a given status, or null if no change */
export function autoAssigneeForStatus(status: TaskStatus): TaskAssignee | null {
  if (AI_ASSIGNEE_STATUSES.includes(status)) return "AI Assistant"
  if (USER_ASSIGNEE_STATUSES.includes(status)) return "User"
  return null
}

/** Returns current week's Sunday-to-Sunday bounds in AEST (UTC+10) */
export function getWeekBounds(): { start: string; end: string } {
  const now = new Date()
  const aest = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const day = aest.getUTCDay()
  const startOfWeek = new Date(aest)
  startOfWeek.setUTCDate(aest.getUTCDate() - day)
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

/** Returns tasks in "To Be Scheduled" and "To Do This Week", sorted by priority then dueDate */
export function getSchedulingData(): { toBeScheduled: Task[]; toDoThisWeek: Task[] } {
  const db = getDb()
  const order = `ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END, dueDate ASC NULLS LAST`
  const tbs = db.prepare(`SELECT * FROM tasks WHERE status = 'To Be Scheduled' ${order}`).all() as TaskRow[]
  const tdtw = db.prepare(`SELECT * FROM tasks WHERE status = 'To Do This Week' ${order}`).all() as TaskRow[]
  return { toBeScheduled: tbs.map(rowToTask), toDoThisWeek: tdtw.map(rowToTask) }
}

/** Composite priority score -- lower is higher priority. High=0, Medium=100, Low=200, +days-until-due as tiebreaker */
export function priorityScore(task: Task): number {
  const bandMap: Record<string, number> = { High: 0, Medium: 100, Low: 200 }
  const band = bandMap[task.priority] ?? 100
  if (!task.dueDate) return band + 99
  const days = Math.max(0, Math.min(98, Math.floor((new Date(task.dueDate).getTime() - Date.now()) / 86400000)))
  return band + days
}

/** Sum estimatedMinutes across tasks (null defaults to 30 min) */
export function sumEstimatedMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0)
}
