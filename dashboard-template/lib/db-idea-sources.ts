// CRUD for idea_sources table — structured idea source metadata

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import type { IdeaSource, IdeaSourcePlatform, IdeaSourceFrequency } from "@/types"

interface IdeaSourceRow {
  id: string
  platform: string
  url: string
  comments: string
  frequency: string
  cronJobId: string | null
  cronJobName: string | null
  validationScore: number | null
  validationSummary: string | null
  validationDetails: string | null
  enabled: number
  createdAt: string
  updatedAt: string
}

function rowToSource(row: IdeaSourceRow): IdeaSource {
  return {
    id: row.id,
    platform: row.platform as IdeaSourcePlatform,
    url: row.url,
    comments: row.comments || "",
    frequency: row.frequency as IdeaSourceFrequency,
    cronJobId: row.cronJobId || undefined,
    cronJobName: row.cronJobName || undefined,
    validationScore: row.validationScore ?? undefined,
    validationSummary: row.validationSummary || undefined,
    validationDetails: row.validationDetails || undefined,
    enabled: row.enabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function getIdeaSources(): IdeaSource[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM idea_sources ORDER BY createdAt DESC").all() as IdeaSourceRow[]
  return rows.map(rowToSource)
}

export function getIdeaSourceById(id: string): IdeaSource | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM idea_sources WHERE id = ?").get(id) as IdeaSourceRow | undefined
  return row ? rowToSource(row) : null
}

interface CreateIdeaSourceInput {
  platform: IdeaSourcePlatform
  url: string
  comments?: string
  frequency: IdeaSourceFrequency
  validationScore?: number
  validationSummary?: string
  validationDetails?: string
}

export function createIdeaSource(input: CreateIdeaSourceInput): IdeaSource {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO idea_sources (id, platform, url, comments, frequency, validationScore, validationSummary, validationDetails, enabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, input.platform, input.url, input.comments || "", input.frequency, input.validationScore ?? null, input.validationSummary || null, input.validationDetails || null, now, now)

  logActivity({ entityType: "content", entityId: id, entityName: `${input.platform} source`, action: "created", detail: `Idea source: ${input.url}` })
  return getIdeaSourceById(id)!
}

export function updateIdeaSource(id: string, updates: Partial<Pick<IdeaSource, "cronJobId" | "cronJobName" | "enabled">>): IdeaSource | null {
  const db = getDb()
  const now = new Date().toISOString()
  const sets: string[] = ["updatedAt = ?"]
  const params: unknown[] = [now]

  if (updates.cronJobId !== undefined) { sets.push("cronJobId = ?"); params.push(updates.cronJobId) }
  if (updates.cronJobName !== undefined) { sets.push("cronJobName = ?"); params.push(updates.cronJobName) }
  if (updates.enabled !== undefined) { sets.push("enabled = ?"); params.push(updates.enabled ? 1 : 0) }

  params.push(id)
  db.prepare(`UPDATE idea_sources SET ${sets.join(", ")} WHERE id = ?`).run(...params)
  return getIdeaSourceById(id)
}

export function getIdeaCountBySourceType(sourceType: string): number {
  const db = getDb()
  const row = db.prepare(
    "SELECT COUNT(*) as cnt FROM content WHERE contentType = 'Idea' AND sourceType = ?"
  ).get(sourceType) as { cnt: number } | undefined
  return row?.cnt ?? 0
}

export function deleteIdeaSource(id: string): void {
  const db = getDb()
  const row = getIdeaSourceById(id)
  db.prepare("DELETE FROM idea_sources WHERE id = ?").run(id)
  if (row) {
    logActivity({ entityType: "content", entityId: id, entityName: `${row.platform} source`, action: "deleted", detail: `Deleted idea source: ${row.url}` })
  }
}
