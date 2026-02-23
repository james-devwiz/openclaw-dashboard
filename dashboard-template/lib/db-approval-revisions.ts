// Approval revision + lookup helpers (extracted from db-approvals.ts for 200-line limit)

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

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

export function getApprovalForRevision(id: string): { title: string; context: string; category: string } | null {
  const db = getDb()
  const row = db.prepare(
    "SELECT title, context, category FROM approvals WHERE id = ? AND status = 'Pending'"
  ).get(id) as { title: string; context: string; category: string } | undefined
  return row || null
}

export function reviseApproval(id: string, title: string, context: string, feedback: string): ApprovalItem | null {
  const db = getDb()
  const now = new Date().toISOString()
  const existing = db.prepare("SELECT response FROM approvals WHERE id = ?").get(id) as { response: string } | undefined
  const ts = new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })
  const entry = `[${ts}] ${feedback}`
  const history = existing?.response ? `${existing.response}\n---\n${entry}` : entry

  db.prepare(
    "UPDATE approvals SET title = ?, context = ?, response = ?, updatedAt = ? WHERE id = ? AND status = 'Pending'"
  ).run(title, context, history, now, id)

  const row = db.prepare("SELECT * FROM approvals WHERE id = ?").get(id) as ApprovalRow | undefined
  if (row) {
    logActivity({
      entityType: "approval", entityId: id, entityName: title,
      action: "updated", detail: "Revised based on user feedback",
    })
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

export function getApprovalByLeadId(leadId: string): ApprovalItem | null {
  const db = getDb()
  const row = db.prepare(
    "SELECT * FROM approvals WHERE relatedLeadId = ? ORDER BY createdAt DESC LIMIT 1"
  ).get(leadId) as ApprovalRow | undefined
  return row ? rowToApproval(row) : null
}
