// Content CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { ContentItem, ContentStage, ContentType, ContentPlatform, ContentSource } from "@/types"

interface ContentRow {
  id: string
  title: string
  contentType: string
  stage: string
  goalId: string | null
  topic: string
  researchNotes: string
  draft: string
  platform: string
  scheduledDate: string | null
  priority: string
  aiGenerated: number
  source: string
  createdAt: string
  updatedAt: string
}

function rowToContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    title: row.title,
    contentType: row.contentType as ContentType,
    stage: row.stage as ContentStage,
    goalId: row.goalId || undefined,
    topic: row.topic || "",
    researchNotes: row.researchNotes || "",
    draft: row.draft || "",
    platform: row.platform as ContentPlatform,
    scheduledDate: row.scheduledDate || undefined,
    priority: row.priority as "High" | "Medium" | "Low",
    aiGenerated: row.aiGenerated === 1,
    source: row.source as ContentSource,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function getContent(stage?: string): ContentItem[] {
  const db = getDb()
  if (stage) {
    const rows = db
      .prepare("SELECT * FROM content WHERE stage = ? ORDER BY updatedAt DESC")
      .all(stage) as ContentRow[]
    return rows.map(rowToContent)
  }
  const rows = db.prepare("SELECT * FROM content ORDER BY updatedAt DESC").all() as ContentRow[]
  return rows.map(rowToContent)
}

export function createContent(input: {
  title: string
  contentType?: ContentType
  stage?: ContentStage
  goalId?: string
  topic?: string
  platform?: ContentPlatform
  scheduledDate?: string
  priority?: string
  source?: ContentSource
}): ContentItem {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO content (id, title, contentType, stage, goalId, topic, researchNotes, draft, platform, scheduledDate, priority, aiGenerated, source, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, 0, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.contentType || "General Dictation",
    input.stage || "Idea",
    input.goalId || null,
    input.topic || "",
    input.platform || "General",
    input.scheduledDate || null,
    input.priority || "Medium",
    input.source || "Manual",
    now,
    now
  )

  const item = rowToContent(db.prepare("SELECT * FROM content WHERE id = ?").get(id) as ContentRow)
  logActivity({ entityType: "content", entityId: id, entityName: input.title, action: "created" })
  return item
}

export function updateContent(
  id: string,
  updates: Partial<Omit<ContentItem, "id" | "createdAt" | "updatedAt" | "aiGenerated">>
): ContentItem | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | null)[] = [now]

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title) }
  if (updates.contentType !== undefined) { fields.push("contentType = ?"); values.push(updates.contentType) }
  if (updates.stage !== undefined) { fields.push("stage = ?"); values.push(updates.stage) }
  if (updates.goalId !== undefined) { fields.push("goalId = ?"); values.push(updates.goalId || null) }
  if (updates.topic !== undefined) { fields.push("topic = ?"); values.push(updates.topic) }
  if (updates.researchNotes !== undefined) { fields.push("researchNotes = ?"); values.push(updates.researchNotes) }
  if (updates.draft !== undefined) { fields.push("draft = ?"); values.push(updates.draft) }
  if (updates.platform !== undefined) { fields.push("platform = ?"); values.push(updates.platform) }
  if (updates.scheduledDate !== undefined) { fields.push("scheduledDate = ?"); values.push(updates.scheduledDate || null) }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority) }
  if (updates.source !== undefined) { fields.push("source = ?"); values.push(updates.source) }

  const oldRow = db.prepare("SELECT * FROM content WHERE id = ?").get(id) as ContentRow | undefined
  values.push(id)
  db.prepare(`UPDATE content SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare("SELECT * FROM content WHERE id = ?").get(id) as ContentRow | undefined
  if (row && oldRow) {
    const changes: Record<string, [unknown, unknown]> = {}
    for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
      const oldVal = oldRow[key as keyof ContentRow]
      const newVal = row[key as keyof ContentRow]
      if (oldVal !== newVal) changes[key] = [oldVal, newVal]
    }
    if (Object.keys(changes).length > 0) {
      logActivity({ entityType: "content", entityId: id, entityName: row.title, action: "updated", changes })
    }
  }
  return row ? rowToContent(row) : null
}

export function updateContentStage(id: string, stage: ContentStage): void {
  const db = getDb()
  const old = db.prepare("SELECT title, stage FROM content WHERE id = ?").get(id) as { title: string; stage: string } | undefined
  const now = new Date().toISOString()
  db.prepare("UPDATE content SET stage = ?, updatedAt = ? WHERE id = ?").run(stage, now, id)
  logActivity({
    entityType: "content", entityId: id, entityName: old?.title || "Unknown",
    action: "stage_changed", detail: `Stage: ${old?.stage || "?"} → ${stage}`,
  })
}

export function deleteContent(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT title FROM content WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("DELETE FROM content WHERE id = ?").run(id)
  logActivity({ entityType: "content", entityId: id, entityName: row?.title || "Unknown", action: "deleted" })
}
