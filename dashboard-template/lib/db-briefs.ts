// Brief CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Brief, BriefType } from "@/types"

interface BriefRow {
  id: string
  briefType: string
  title: string
  content: string
  date: string
  source: string
  metadata: string
  createdAt: string
}

function rowToBrief(row: BriefRow): Brief {
  return {
    id: row.id,
    briefType: row.briefType as BriefType,
    title: row.title,
    content: row.content,
    date: row.date,
    source: row.source as Brief["source"],
    metadata: row.metadata || undefined,
    createdAt: row.createdAt,
  }
}

export function getBriefs(date?: string): Brief[] {
  const db = getDb()
  if (date) {
    const rows = db.prepare("SELECT * FROM briefs WHERE date = ? ORDER BY createdAt DESC").all(date) as BriefRow[]
    return rows.map(rowToBrief)
  }
  const rows = db.prepare("SELECT * FROM briefs ORDER BY createdAt DESC LIMIT 50").all() as BriefRow[]
  return rows.map(rowToBrief)
}

export function getBriefsInRange(from: string, to: string): Brief[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM briefs WHERE date >= ? AND date <= ? ORDER BY date DESC, createdAt DESC").all(from, to) as BriefRow[]
  return rows.map(rowToBrief)
}

export function createBrief(input: {
  briefType: BriefType
  title: string
  content: string
  date: string
  source?: Brief["source"]
  metadata?: string
}): Brief {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO briefs (id, briefType, title, content, date, source, metadata, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.briefType, input.title, input.content, input.date, input.source || "manual", input.metadata || "", now)

  logActivity({ entityType: "brief", entityId: id, entityName: input.title, action: "created", detail: `Brief: ${input.briefType}` })
  return rowToBrief(db.prepare("SELECT * FROM briefs WHERE id = ?").get(id) as BriefRow)
}

export function updateBrief(id: string, input: {
  content: string
  title?: string
  briefType?: BriefType
}): Brief | null {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM briefs WHERE id = ?").get(id) as BriefRow | undefined
  if (!existing) return null

  const sets: string[] = ["content = ?"]
  const params: string[] = [input.content]

  if (input.title) {
    sets.push("title = ?")
    params.push(input.title)
  }
  if (input.briefType) {
    sets.push("briefType = ?")
    params.push(input.briefType)
  }

  params.push(id)
  db.prepare(`UPDATE briefs SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  logActivity({ entityType: "brief", entityId: id, entityName: input.title || existing.title, action: "updated", detail: "Brief updated" })
  return rowToBrief(db.prepare("SELECT * FROM briefs WHERE id = ?").get(id) as BriefRow)
}

export function deleteBrief(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT title FROM briefs WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("DELETE FROM briefs WHERE id = ?").run(id)
  logActivity({ entityType: "brief", entityId: id, entityName: row?.title || "Unknown", action: "deleted", detail: "Brief deleted" })
}

interface SearchOpts {
  from?: string
  to?: string
  briefType?: string
  kind?: string
  source?: string
  search?: string
  sortBy?: string
  sortDir?: string
  limit?: number
  offset?: number
}

const BRIEF_KINDS: Record<string, string[]> = {
  brief: ["Morning Brief", "Pre-Meeting Brief"],
  report: ["End of Day Report", "Post-Meeting Report", "Weekly Review", "Business Analysis", "Cost Report", "Error Report", "Self-Improvement Report", "Custom"],
}

function buildWhere(opts: SearchOpts, includeType = true): { clause: string; params: (string | number)[] } {
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (opts.from) { conditions.push("date >= ?"); params.push(opts.from) }
  if (opts.to) { conditions.push("date <= ?"); params.push(opts.to) }
  if (includeType && opts.briefType) { conditions.push("briefType = ?"); params.push(opts.briefType) }
  if (includeType && !opts.briefType && opts.kind && BRIEF_KINDS[opts.kind]) {
    const types = BRIEF_KINDS[opts.kind]
    conditions.push(`briefType IN (${types.map(() => "?").join(",")})`)
    params.push(...types)
  }
  if (opts.source) { conditions.push("source = ?"); params.push(opts.source) }
  if (opts.search) {
    conditions.push("(title LIKE ? OR content LIKE ?)")
    const term = `%${opts.search}%`
    params.push(term, term)
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  return { clause, params }
}

export function searchBriefs(opts: SearchOpts): Brief[] {
  const db = getDb()
  const { clause, params } = buildWhere(opts)
  const sortCol = opts.sortBy === "date" ? "date" : "createdAt"
  const sortDir = opts.sortDir === "ASC" ? "ASC" : "DESC"
  const limit = opts.limit || 25
  const offset = opts.offset || 0

  params.push(limit, offset)
  const rows = db.prepare(`SELECT * FROM briefs ${clause} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`).all(...params) as BriefRow[]
  return rows.map(rowToBrief)
}

export function countBriefs(opts: SearchOpts): number {
  const db = getDb()
  const { clause, params } = buildWhere(opts)
  const row = db.prepare(`SELECT COUNT(*) as count FROM briefs ${clause}`).get(...params) as { count: number }
  return row.count
}

export function getBriefTypeCounts(opts: SearchOpts): Record<string, number> {
  const db = getDb()
  const { clause, params } = buildWhere(opts, false)
  const rows = db.prepare(`SELECT briefType, COUNT(*) as count FROM briefs ${clause} GROUP BY briefType`).all(...params) as Array<{ briefType: string; count: number }>
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.briefType] = r.count
  return counts
}
