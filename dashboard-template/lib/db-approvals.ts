// Approval CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import { deleteTask } from "./db-tasks"
import { createComment } from "./db-comments"

import type { ApprovalItem, ApprovalCategory, ApprovalStatus, ApprovalPriority, ApprovalRequester } from "@/types"

interface ApprovalRow {
  id: string
  title: string
  category: string
  status: string
  priority: string
  context: string
  options: string
  response: string
  relatedGoalId: string | null
  relatedTaskId: string | null
  requestedBy: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

function rowToApproval(row: ApprovalRow): ApprovalItem {
  const db = getDb()
  let relatedTaskName: string | undefined
  if (row.relatedTaskId) {
    const task = db.prepare("SELECT name FROM tasks WHERE id = ?").get(row.relatedTaskId) as { name: string } | undefined
    relatedTaskName = task?.name
  }
  return {
    id: row.id,
    title: row.title,
    category: row.category as ApprovalCategory,
    status: row.status as ApprovalStatus,
    priority: row.priority as ApprovalPriority,
    context: row.context || "",
    options: row.options || "",
    response: row.response || "",
    relatedGoalId: row.relatedGoalId || undefined,
    relatedTaskId: row.relatedTaskId || undefined,
    relatedTaskName,
    requestedBy: row.requestedBy as ApprovalRequester,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt || undefined,
  }
}

export function getApprovals(status?: string): ApprovalItem[] {
  const db = getDb()
  if (status) {
    const rows = db
      .prepare(
        `SELECT * FROM approvals WHERE status = ? ORDER BY
         CASE priority WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END,
         createdAt DESC`
      )
      .all(status) as ApprovalRow[]
    return rows.map(rowToApproval)
  }
  const rows = db
    .prepare(
      `SELECT * FROM approvals ORDER BY
       CASE priority WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END,
       createdAt DESC`
    )
    .all() as ApprovalRow[]
  return rows.map(rowToApproval)
}

export function getPendingCount(): number {
  const db = getDb()
  const row = db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'Pending'").get() as { count: number }
  return row.count
}

export function createApproval(input: {
  title: string
  category?: ApprovalCategory
  priority?: ApprovalPriority
  context?: string
  options?: string
  relatedGoalId?: string
  relatedTaskId?: string
  requestedBy?: ApprovalRequester
}): ApprovalItem {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO approvals (id, title, category, status, priority, context, options, response, relatedGoalId, relatedTaskId, requestedBy, createdAt, updatedAt)
     VALUES (?, ?, ?, 'Pending', ?, ?, ?, '', ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.category || "Information Requested",
    input.priority || "Medium",
    input.context || "",
    input.options || "",
    input.relatedGoalId || null,
    input.relatedTaskId || null,
    input.requestedBy || "Manual",
    now,
    now
  )

  const item = rowToApproval(db.prepare("SELECT * FROM approvals WHERE id = ?").get(id) as ApprovalRow)
  logActivity({ entityType: "approval", entityId: id, entityName: input.title, action: "created" })
  return item
}

export function respondToApproval(
  id: string,
  status: ApprovalStatus,
  response: string
): ApprovalItem | null {
  const db = getDb()
  const old = db.prepare("SELECT title, relatedTaskId FROM approvals WHERE id = ?").get(id) as
    { title: string; relatedTaskId: string | null } | undefined
  const now = new Date().toISOString()
  db.prepare(
    "UPDATE approvals SET status = ?, response = ?, resolvedAt = ?, updatedAt = ? WHERE id = ?"
  ).run(status, response, now, now, id)

  const row = db.prepare("SELECT * FROM approvals WHERE id = ?").get(id) as ApprovalRow | undefined
  if (row) {
    logActivity({
      entityType: "approval", entityId: id, entityName: old?.title || "Unknown",
      action: "responded", detail: `Responded: ${status}`,
    })

    // Side effects for task-linked approvals
    if (old?.relatedTaskId) {
      if (status === "Rejected") {
        deleteTask(old.relatedTaskId)
      } else if (status === "Approved" && response) {
        createComment({ taskId: old.relatedTaskId, content: response, source: "user" })
      }
    }
  }
  return row ? rowToApproval(row) : null
}

export function deleteApproval(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT title FROM approvals WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("DELETE FROM approvals WHERE id = ?").run(id)
  logActivity({ entityType: "approval", entityId: id, entityName: row?.title || "Unknown", action: "deleted" })
}

export function getApprovalByTaskId(taskId: string): ApprovalItem | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM approvals WHERE relatedTaskId = ? LIMIT 1").get(taskId) as ApprovalRow | undefined
  return row ? rowToApproval(row) : null
}
