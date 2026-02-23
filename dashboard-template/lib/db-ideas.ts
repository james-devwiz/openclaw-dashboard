// Idea-specific queries (extracted from db-content.ts)

import { randomUUID } from "crypto"
import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import { rowToContent, parseJsonArray } from "./db-content"
import type { ContentRow } from "./db-content"
import type { ContentItem, ContentType, ContentFormat } from "@/types"

export interface IdeaQueryParams {
  category?: string
  search?: string
  sortBy?: string
  sortDir?: "ASC" | "DESC"
  limit?: number
  offset?: number
}

function buildIdeaWhere(params: IdeaQueryParams): { clause: string; values: (string | number)[] } {
  const where = ["contentType = 'Idea'"]
  const values: (string | number)[] = []
  if (params.category) {
    where.push("ideaCategories LIKE ?")
    values.push(`%${params.category}%`)
  }
  if (params.search) {
    where.push("(title LIKE ? OR topic LIKE ? OR researchNotes LIKE ?)")
    const term = `%${params.search}%`
    values.push(term, term, term)
  }
  return { clause: where.join(" AND "), values }
}

export function getIdeas(params: IdeaQueryParams): ContentItem[] {
  const db = getDb()
  const { clause, values } = buildIdeaWhere(params)
  const sortCol = params.sortBy === "title" ? "title" : params.sortBy === "priority" ? "priority" : "createdAt"
  const dir = params.sortDir === "ASC" ? "ASC" : "DESC"
  const limit = params.limit || 25
  const offset = params.offset || 0
  const rows = db.prepare(
    `SELECT * FROM content WHERE ${clause} ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`
  ).all(...values, limit, offset) as ContentRow[]
  return rows.map(rowToContent)
}

export function countIdeas(params: IdeaQueryParams): number {
  const db = getDb()
  const { clause, values } = buildIdeaWhere(params)
  const row = db.prepare(`SELECT COUNT(*) as c FROM content WHERE ${clause}`).get(...values) as { c: number }
  return row.c
}

export function getIdeaCategoryCounts(): Record<string, number> {
  const db = getDb()
  const rows = db.prepare("SELECT ideaCategories FROM content WHERE contentType = 'Idea'").all() as Array<{ ideaCategories: string }>
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const cats = parseJsonArray<string>(row.ideaCategories)
    if (cats) for (const cat of cats) counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
}

const FORMAT_TO_POST_FORMAT: Record<string, string> = {
  Static: "text",
  Carousel: "carousel",
  "Short Form": "short_video",
  "Long Form": "long_video",
}

export function promoteToPipeline(ideaId: string, formats: ContentFormat[], _contentType: ContentType): string[] {
  const db = getDb()
  const idea = db.prepare("SELECT * FROM content WHERE id = ?").get(ideaId) as ContentRow | undefined
  if (!idea) throw new Error("Idea not found")

  const now = new Date().toISOString()
  const pipelineIds: string[] = []

  for (const format of formats) {
    const pid = randomUUID()
    pipelineIds.push(pid)
    const postFormat = FORMAT_TO_POST_FORMAT[format] || "text"
    db.prepare(
      `INSERT INTO posts (id, title, format, stage, caption, body, hook, cta, scriptNotes, slides, researchNotes, topic, hashtags, goalId, priority, source, createdAt, updatedAt)
       VALUES (?, ?, ?, 'Research', '', '', '', '', '', '[]', ?, ?, '[]', ?, ?, 'Manual', ?, ?)`
    ).run(pid, `${idea.title} — ${format}`, postFormat, idea.researchNotes || "", idea.topic || "", idea.goalId, idea.priority, now, now)
    logActivity({ entityType: "post", entityId: pid, entityName: `${idea.title} — ${format}`, action: "created", detail: `Promoted from idea ${ideaId}` })
  }

  db.prepare("UPDATE content SET promotedPipelineIds = ?, updatedAt = ? WHERE id = ?").run(JSON.stringify(pipelineIds), now, ideaId)
  logActivity({ entityType: "content", entityId: ideaId, entityName: idea.title, action: "updated", detail: `Promoted to ${formats.length} pipeline items` })
  return pipelineIds
}
