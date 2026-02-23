// LinkedIn thread CRUD operations — extracted from db-linkedin.ts

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { LinkedInThread, ThreadStatus, ThreadCategory, MessageDirection } from "@/types"

// ── Row type ──

interface ThreadRow {
  id: string; unipileId: string | null; participantId: string | null
  participantName: string; participantHeadline: string; participantAvatarUrl: string
  participantProfileUrl: string; lastMessage: string; lastMessageAt: string | null
  lastMessageDirection: string; unreadCount: number; status: string; category: string
  champScore: number | null; wampScore: number | null; qualificationData: string | null
  isSelling: number; isQualified: number; isPartner: number
  classifiedAt: string | null; intent: string; enrichmentData: string | null
  postData: string | null; snoozeUntil: string | null; isSnoozed: number; isArchived: number
  syncedAt: string | null; manualClassification: number; classificationNote: string
  createdAt: string; updatedAt: string
}

function rowToThread(r: ThreadRow): LinkedInThread {
  return {
    id: r.id, unipileId: r.unipileId || "", participantId: r.participantId || "",
    participantName: r.participantName, participantHeadline: r.participantHeadline || "",
    participantAvatarUrl: r.participantAvatarUrl || "",
    participantProfileUrl: r.participantProfileUrl || "",
    lastMessage: r.lastMessage || "", lastMessageAt: r.lastMessageAt || "",
    lastMessageDirection: (r.lastMessageDirection || "incoming") as MessageDirection,
    unreadCount: r.unreadCount || 0, status: r.status as ThreadStatus,
    category: (r.category || "") as ThreadCategory,
    champScore: r.champScore ?? undefined, wampScore: r.wampScore ?? undefined,
    qualificationData: r.qualificationData || undefined,
    isSelling: Boolean(r.isSelling), isQualified: Boolean(r.isQualified),
    isPartner: Boolean(r.isPartner), classifiedAt: r.classifiedAt || undefined,
    intent: r.intent || "", enrichmentData: r.enrichmentData || undefined,
    postData: r.postData || undefined, snoozeUntil: r.snoozeUntil || undefined,
    isSnoozed: Boolean(r.isSnoozed), isArchived: Boolean(r.isArchived),
    manualClassification: Boolean(r.manualClassification) || undefined,
    classificationNote: r.classificationNote || undefined,
    syncedAt: r.syncedAt || "", createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

/** Shared filter conditions -- spammers/partners excluded from normal status tabs */
function addFilterConditions(filter: string, conds: string[], params: (string | number)[]) {
  const A = "isSnoozed = 0 AND isArchived = 0", X = "isSelling = 0 AND isPartner = 0"
  if (filter === "unread") { conds.push(`unreadCount > 0 AND ${A} AND ${X}`) }
  else if (filter === "needs-reply") { conds.push(`status = 'needs-reply' AND ${A} AND ${X}`) }
  else if (filter === "waiting") { conds.push(`status = 'waiting' AND ${A} AND ${X}`) }
  else if (filter === "snoozed") { conds.push("isSnoozed = 1") }
  else if (filter === "archived") { conds.push("isArchived = 1") }
  else if (filter === "spammers") { conds.push("isSelling = 1 AND isArchived = 0") }
  else if (filter === "partners") { conds.push("isPartner = 1 AND isArchived = 0") }
  else { conds.push(`status = ? AND ${A} AND ${X}`); params.push(filter) }
}

function applyCommonFilters(opts: { status?: string; category?: string; search?: string },
  conds: string[], params: (string | number)[]) {
  if (opts.status && opts.status !== "all") addFilterConditions(opts.status, conds, params)
  if (opts.category && opts.category !== "all") { conds.push("category = ?"); params.push(opts.category) }
  if (opts.search) {
    conds.push("(participantName LIKE ? OR lastMessage LIKE ?)")
    const t = `%${opts.search}%`; params.push(t, t)
  }
}

export function getThreads(opts?: {
  status?: string; search?: string; category?: string; limit?: number; offset?: number
}): LinkedInThread[] {
  const db = getDb(), conds: string[] = ["1=1"], params: (string | number)[] = []
  if (opts) applyCommonFilters(opts, conds, params)
  params.push(opts?.limit || 50, opts?.offset || 0)
  const rows = db.prepare(
    `SELECT * FROM linkedin_threads WHERE ${conds.join(" AND ")} ORDER BY lastMessageAt DESC LIMIT ? OFFSET ?`
  ).all(...params) as ThreadRow[]
  return rows.map(rowToThread)
}

export function getThreadCount(opts?: { status?: string; search?: string; category?: string }): number {
  const db = getDb(), conds: string[] = ["1=1"], params: (string | number)[] = []
  if (opts) applyCommonFilters(opts, conds, params)
  return (db.prepare(
    `SELECT COUNT(*) as c FROM linkedin_threads WHERE ${conds.join(" AND ")}`
  ).get(...params) as { c: number }).c
}

export function getThreadById(id: string): LinkedInThread | null {
  const r = getDb().prepare("SELECT * FROM linkedin_threads WHERE id = ?").get(id) as ThreadRow | undefined
  return r ? rowToThread(r) : null
}

export function getThreadByUnipileId(unipileId: string): LinkedInThread | null {
  const r = getDb().prepare("SELECT * FROM linkedin_threads WHERE unipileId = ?").get(unipileId) as ThreadRow | undefined
  return r ? rowToThread(r) : null
}

export function upsertThread(input: {
  unipileId: string; participantId?: string; participantName: string
  participantHeadline?: string; participantAvatarUrl?: string; participantProfileUrl?: string
  lastMessage?: string; lastMessageAt?: string; lastMessageDirection?: MessageDirection
  unreadCount?: number
}): LinkedInThread {
  const db = getDb(), now = new Date().toISOString()
  const existing = db.prepare("SELECT id, status, participantAvatarUrl FROM linkedin_threads WHERE unipileId = ?")
    .get(input.unipileId) as { id: string; status: string; participantAvatarUrl: string } | undefined

  if (existing) {
    const avatar = input.participantAvatarUrl || existing.participantAvatarUrl || ""
    const statusFix = existing.status === "unread" ? "needs-reply" : existing.status
    db.prepare(
      `UPDATE linkedin_threads SET participantName = ?, participantHeadline = ?,
       participantAvatarUrl = ?, participantProfileUrl = ?,
       lastMessage = ?, lastMessageAt = ?, lastMessageDirection = ?,
       unreadCount = ?, status = ?, syncedAt = ?, updatedAt = ? WHERE id = ?`
    ).run(input.participantName, input.participantHeadline || "", avatar,
      input.participantProfileUrl || "", input.lastMessage || "",
      input.lastMessageAt || null, input.lastMessageDirection || "",
      input.unreadCount ?? 0, statusFix, now, now, existing.id)
    return rowToThread(db.prepare("SELECT * FROM linkedin_threads WHERE id = ?").get(existing.id) as ThreadRow)
  }

  const id = randomUUID()
  const initialStatus = input.lastMessageDirection === "outgoing" ? "waiting" : "needs-reply"
  db.prepare(
    `INSERT INTO linkedin_threads (id, unipileId, participantId, participantName,
     participantHeadline, participantAvatarUrl, participantProfileUrl,
     lastMessage, lastMessageAt, lastMessageDirection, unreadCount,
     status, category, syncedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?)`
  ).run(id, input.unipileId, input.participantId || null, input.participantName,
    input.participantHeadline || "", input.participantAvatarUrl || "",
    input.participantProfileUrl || "", input.lastMessage || "",
    input.lastMessageAt || null, input.lastMessageDirection || "",
    input.unreadCount ?? 0, initialStatus, now, now, now)
  return rowToThread(db.prepare("SELECT * FROM linkedin_threads WHERE id = ?").get(id) as ThreadRow)
}

type ThreadUpdate = Partial<Pick<LinkedInThread,
  "status" | "category" | "champScore" | "wampScore" | "qualificationData" |
  "isSelling" | "isQualified" | "isPartner" | "classifiedAt" | "intent" |
  "enrichmentData" | "postData" | "snoozeUntil" | "isSnoozed" | "isArchived" | "unreadCount"
>> & { manualClassification?: boolean; classificationNote?: string }

const BOOL_FIELDS = ["isSelling", "isQualified", "isPartner", "isSnoozed", "isArchived", "manualClassification"] as const
const STR_FIELDS = ["status", "category", "qualificationData", "classifiedAt", "intent",
  "enrichmentData", "postData", "classificationNote"] as const
const NUM_FIELDS = ["champScore", "wampScore", "unreadCount"] as const

export function updateThread(id: string, updates: ThreadUpdate): LinkedInThread | null {
  const db = getDb(), now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"], values: (string | number | null)[] = [now]

  for (const k of STR_FIELDS) if ((updates as Record<string, unknown>)[k] !== undefined) { fields.push(`${k} = ?`); values.push((updates as Record<string, unknown>)[k] as string) }
  for (const k of NUM_FIELDS) if ((updates as Record<string, unknown>)[k] !== undefined) { fields.push(`${k} = ?`); values.push((updates as Record<string, unknown>)[k] as number) }
  for (const k of BOOL_FIELDS) if ((updates as Record<string, unknown>)[k] !== undefined) { fields.push(`${k} = ?`); values.push((updates as Record<string, unknown>)[k] ? 1 : 0) }
  if (updates.snoozeUntil !== undefined) { fields.push("snoozeUntil = ?"); values.push(updates.snoozeUntil || null) }

  values.push(id)
  db.prepare(`UPDATE linkedin_threads SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare("SELECT * FROM linkedin_threads WHERE id = ?").get(id) as ThreadRow | undefined
  if (row) {
    logActivity({ entityType: "linkedin", entityId: id, entityName: row.participantName, action: "updated", detail: `Thread status: ${row.status}` })
    return rowToThread(row)
  }
  return null
}

/** Get threads that haven't been classified yet */
export function getUnclassifiedThreadIds(): string[] {
  const rows = getDb().prepare(
    "SELECT id FROM linkedin_threads WHERE classifiedAt IS NULL AND isArchived = 0 ORDER BY lastMessageAt DESC"
  ).all() as Array<{ id: string }>
  return rows.map((r) => r.id)
}

/** Get recent manual classification corrections for AI learning */
export function getManualClassifications(limit = 5): Array<{
  participantHeadline: string; category: string; classificationNote: string
}> {
  return getDb().prepare(
    `SELECT participantHeadline, category, classificationNote FROM linkedin_threads
     WHERE manualClassification = 1 ORDER BY updatedAt DESC LIMIT ?`
  ).all(limit) as Array<{ participantHeadline: string; category: string; classificationNote: string }>
}

/** Auto-unsnooze expired threads */
export function unsnoozeExpiredThreads(): number {
  return getDb().prepare(
    `UPDATE linkedin_threads SET isSnoozed = 0, status = 'needs-reply', snoozeUntil = NULL
     WHERE isSnoozed = 1 AND snoozeUntil IS NOT NULL AND snoozeUntil < ?`
  ).run(new Date().toISOString()).changes
}
