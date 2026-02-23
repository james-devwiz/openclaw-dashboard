// LinkedIn CRUD operations — messages & actions
// Thread operations extracted to ./db-linkedin-threads.ts

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type {
  LinkedInMessage, LinkedInAction,
  LinkedInActionType, LinkedInActionStatus, MessageDirection,
} from "@/types"

// Re-export all thread functions so existing imports from "@/lib/db-linkedin" still work
export {
  getThreads, getThreadCount, getThreadById, getThreadByUnipileId,
  upsertThread, updateThread, getUnclassifiedThreadIds,
  getManualClassifications, unsnoozeExpiredThreads,
} from "./db-linkedin-threads"

// ── Row types ──

interface MessageRow {
  id: string; threadId: string; unipileId: string | null
  senderId: string | null; senderName: string; content: string
  direction: string; timestamp: string
}

interface ActionRow {
  id: string; actionType: string; targetId: string | null; targetName: string
  payload: string; status: string; approvalId: string | null; error: string | null
  executedAt: string | null; createdAt: string; updatedAt: string
}

// ── Converters ──

function rowToMessage(r: MessageRow): LinkedInMessage {
  return {
    id: r.id, threadId: r.threadId, unipileId: r.unipileId || "",
    senderId: r.senderId || "", senderName: r.senderName || "",
    content: r.content, direction: r.direction as MessageDirection,
    timestamp: r.timestamp,
  }
}

function rowToAction(r: ActionRow): LinkedInAction {
  return {
    id: r.id, actionType: r.actionType as LinkedInActionType,
    targetId: r.targetId || "", targetName: r.targetName || "",
    payload: r.payload, status: r.status as LinkedInActionStatus,
    approvalId: r.approvalId || undefined, error: r.error || undefined,
    executedAt: r.executedAt || undefined,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

// ── Messages ──

export function getMessages(threadId: string): LinkedInMessage[] {
  const db = getDb()
  const rows = db.prepare(
    "SELECT * FROM linkedin_messages WHERE threadId = ? ORDER BY timestamp ASC"
  ).all(threadId) as MessageRow[]
  return rows.map(rowToMessage)
}

export function upsertMessage(input: {
  threadId: string; unipileId: string; senderId?: string; senderName?: string
  content: string; direction: MessageDirection; timestamp: string
}): LinkedInMessage {
  const db = getDb()
  const existing = db.prepare("SELECT id FROM linkedin_messages WHERE unipileId = ?")
    .get(input.unipileId) as { id: string } | undefined

  if (existing) {
    return rowToMessage(db.prepare("SELECT * FROM linkedin_messages WHERE id = ?").get(existing.id) as MessageRow)
  }

  const id = randomUUID()
  db.prepare(
    `INSERT INTO linkedin_messages (id, threadId, unipileId, senderId, senderName, content, direction, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.threadId, input.unipileId, input.senderId || null, input.senderName || "", input.content, input.direction, input.timestamp)
  return rowToMessage(db.prepare("SELECT * FROM linkedin_messages WHERE id = ?").get(id) as MessageRow)
}

// ── Actions ──

export function getActions(status?: string): LinkedInAction[] {
  const db = getDb()
  if (status) {
    const rows = db.prepare("SELECT * FROM linkedin_actions WHERE status = ? ORDER BY createdAt DESC").all(status) as ActionRow[]
    return rows.map(rowToAction)
  }
  const rows = db.prepare("SELECT * FROM linkedin_actions ORDER BY createdAt DESC").all() as ActionRow[]
  return rows.map(rowToAction)
}

export function getActionById(id: string): LinkedInAction | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM linkedin_actions WHERE id = ?").get(id) as ActionRow | undefined
  return row ? rowToAction(row) : null
}

export function getActionByApprovalId(approvalId: string): LinkedInAction | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM linkedin_actions WHERE approvalId = ?").get(approvalId) as ActionRow | undefined
  return row ? rowToAction(row) : null
}

export function createAction(input: {
  actionType: LinkedInActionType; targetId?: string; targetName?: string
  payload: string; approvalId?: string
}): LinkedInAction {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO linkedin_actions (id, actionType, targetId, targetName, payload, status, approvalId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).run(id, input.actionType, input.targetId || null, input.targetName || "", input.payload, input.approvalId || null, now, now)

  logActivity({ entityType: "linkedin", entityId: id, entityName: input.targetName || "LinkedIn Action", action: "created", detail: `Action: ${input.actionType}` })
  return rowToAction(db.prepare("SELECT * FROM linkedin_actions WHERE id = ?").get(id) as ActionRow)
}

export function updateActionStatus(
  id: string, status: LinkedInActionStatus, error?: string
): LinkedInAction | null {
  const db = getDb()
  const now = new Date().toISOString()
  const executedAt = status === "executed" ? now : null

  db.prepare(
    "UPDATE linkedin_actions SET status = ?, error = ?, executedAt = ?, updatedAt = ? WHERE id = ?"
  ).run(status, error || null, executedAt, now, id)

  const row = db.prepare("SELECT * FROM linkedin_actions WHERE id = ?").get(id) as ActionRow | undefined
  if (row) {
    logActivity({ entityType: "linkedin", entityId: id, entityName: row.targetName || "LinkedIn Action", action: "status_changed", detail: `Action ${status}` })
    return rowToAction(row)
  }
  return null
}
