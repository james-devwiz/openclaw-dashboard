// Approval CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import { deleteTask, updateTaskStatus } from "./db-tasks"
import { createComment } from "./db-comments"
import { getActionByApprovalId, updateActionStatus } from "./db-linkedin"

import type { ApprovalItem, ApprovalCategory, ApprovalStatus, ApprovalPriority, ApprovalRequester } from "@/types"

// Re-export revision + lookup helpers so consumers don't need to change imports
export { getApprovalForRevision, reviseApproval, deleteApproval, getApprovalByTaskId, getApprovalByLeadId } from "./db-approval-revisions"

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
  relatedLeadId: string | null
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
  let relatedLeadName: string | undefined
  if (row.relatedLeadId) {
    const lead = db.prepare("SELECT companyName FROM leads WHERE id = ?").get(row.relatedLeadId) as { companyName: string } | undefined
    relatedLeadName = lead?.companyName
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
    relatedLeadId: row.relatedLeadId || undefined,
    relatedLeadName,
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
  relatedLeadId?: string
  requestedBy?: ApprovalRequester
}): ApprovalItem {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO approvals (id, title, category, status, priority, context, options, response, relatedGoalId, relatedTaskId, relatedLeadId, requestedBy, createdAt, updatedAt)
     VALUES (?, ?, ?, 'Pending', ?, ?, ?, '', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.category || "Information Requested",
    input.priority || "Medium",
    input.context || "",
    input.options || "",
    input.relatedGoalId || null,
    input.relatedTaskId || null,
    input.relatedLeadId || null,
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
  const old = db.prepare("SELECT title, relatedTaskId, relatedLeadId, category FROM approvals WHERE id = ?").get(id) as
    { title: string; relatedTaskId: string | null; relatedLeadId: string | null; category: string } | undefined
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
      } else if (status === "Approved") {
        const taskRow = db.prepare("SELECT status FROM tasks WHERE id = ?")
          .get(old.relatedTaskId) as { status: string } | undefined
        if (taskRow?.status === "Backlog") {
          updateTaskStatus(old.relatedTaskId, "To Be Scheduled")
        }
        if (response) {
          createComment({ taskId: old.relatedTaskId, content: response, source: "user" })
        }
      }
    }

    // Side effects for lead-linked approvals
    if (old?.relatedLeadId) {
      handleLeadApprovalSideEffect(old.relatedLeadId, old.category, status)
    }

    // Side effects for LinkedIn-linked approvals
    const linkedAction = getActionByApprovalId(id)
    if (linkedAction) {
      if (status === "Approved") {
        updateActionStatus(linkedAction.id, "approved")
      } else if (status === "Rejected") {
        updateActionStatus(linkedAction.id, "rejected")
      }
    }
  }
  return row ? rowToApproval(row) : null
}

function handleLeadApprovalSideEffect(leadId: string, category: string, status: ApprovalStatus): void {
  // Dynamic import to avoid circular dependency (lead-pipeline imports createApproval)
  import("./lead-pipeline").then(({ handleLeadApprovalResponse }) => {
    handleLeadApprovalResponse(leadId, category, status).catch((err: Error) => {
      console.error(`Lead approval side-effect failed for ${leadId}:`, err.message)
    })
  }).catch((err) => {
    console.error(`Failed to load lead-pipeline module:`, err)
  })
}
