// Posts CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Post, PostFormat, PostStage, CarouselSlide, PostPlatformEntry } from "@/types/studio.types"

interface PostRow {
  id: string; title: string; format: string; stage: string
  caption: string; body: string; hook: string; cta: string
  scriptNotes: string; slides: string; researchNotes: string
  topic: string; hashtags: string; goalId: string | null
  priority: string; source: string; parentPostId: string | null
  createdAt: string; updatedAt: string
}

function parseJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function rowToPost(row: PostRow, platforms: PostPlatformEntry[] = []): Post {
  return {
    id: row.id, title: row.title,
    format: row.format as PostFormat,
    stage: row.stage as PostStage,
    caption: row.caption || "", body: row.body || "",
    hook: row.hook || "", cta: row.cta || "",
    scriptNotes: row.scriptNotes || "",
    slides: parseJson<CarouselSlide[]>(row.slides, []),
    researchNotes: row.researchNotes || "",
    topic: row.topic || "",
    hashtags: parseJson<string[]>(row.hashtags, []),
    goalId: row.goalId || undefined,
    priority: row.priority as Post["priority"],
    source: row.source,
    parentPostId: row.parentPostId || undefined,
    platforms,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  }
}

export function getPosts(stage?: string, format?: string): Post[] {
  const db = getDb()
  const where: string[] = []
  const params: string[] = []
  if (stage) { where.push("stage = ?"); params.push(stage) }
  if (format) { where.push("format = ?"); params.push(format) }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const rows = db.prepare(`SELECT * FROM posts ${clause} ORDER BY updatedAt DESC`).all(...params) as PostRow[]

  const platformRows = db.prepare("SELECT * FROM post_platforms ORDER BY postId").all() as PostPlatformEntry[]
  const platformMap = new Map<string, PostPlatformEntry[]>()
  for (const p of platformRows) {
    const list = platformMap.get(p.postId) || []
    list.push(p)
    platformMap.set(p.postId, list)
  }

  return rows.map((r) => rowToPost(r, platformMap.get(r.id) || []))
}

export function getPostById(id: string): Post | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as PostRow | undefined
  if (!row) return null
  const platforms = db.prepare("SELECT * FROM post_platforms WHERE postId = ?").all(id) as PostPlatformEntry[]
  return rowToPost(row, platforms)
}

export function createPost(input: {
  title: string; format?: PostFormat; stage?: PostStage
  caption?: string; body?: string; hook?: string; cta?: string
  scriptNotes?: string; slides?: CarouselSlide[]
  researchNotes?: string; topic?: string; hashtags?: string[]
  goalId?: string; priority?: string; source?: string; parentPostId?: string
}): Post {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO posts (id, title, format, stage, caption, body, hook, cta, scriptNotes, slides, researchNotes, topic, hashtags, goalId, priority, source, parentPostId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, input.title, input.format || "text", input.stage || "Idea",
    input.caption || "", input.body || "", input.hook || "", input.cta || "",
    input.scriptNotes || "", JSON.stringify(input.slides || []),
    input.researchNotes || "", input.topic || "",
    JSON.stringify(input.hashtags || []),
    input.goalId || null, input.priority || "Medium",
    input.source || "Manual", input.parentPostId || null, now, now,
  )

  const post = getPostById(id)!
  logActivity({ entityType: "post", entityId: id, entityName: input.title, action: "created" })
  return post
}

export function updatePost(id: string, updates: Partial<Omit<Post, "id" | "createdAt" | "updatedAt" | "platforms">>): Post | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | number | null)[] = [now]

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title) }
  if (updates.format !== undefined) { fields.push("format = ?"); values.push(updates.format) }
  if (updates.stage !== undefined) { fields.push("stage = ?"); values.push(updates.stage) }
  if (updates.caption !== undefined) { fields.push("caption = ?"); values.push(updates.caption) }
  if (updates.body !== undefined) { fields.push("body = ?"); values.push(updates.body) }
  if (updates.hook !== undefined) { fields.push("hook = ?"); values.push(updates.hook) }
  if (updates.cta !== undefined) { fields.push("cta = ?"); values.push(updates.cta) }
  if (updates.scriptNotes !== undefined) { fields.push("scriptNotes = ?"); values.push(updates.scriptNotes) }
  if (updates.slides !== undefined) { fields.push("slides = ?"); values.push(JSON.stringify(updates.slides)) }
  if (updates.researchNotes !== undefined) { fields.push("researchNotes = ?"); values.push(updates.researchNotes) }
  if (updates.topic !== undefined) { fields.push("topic = ?"); values.push(updates.topic) }
  if (updates.hashtags !== undefined) { fields.push("hashtags = ?"); values.push(JSON.stringify(updates.hashtags)) }
  if (updates.goalId !== undefined) { fields.push("goalId = ?"); values.push(updates.goalId || null) }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority) }
  if (updates.parentPostId !== undefined) { fields.push("parentPostId = ?"); values.push(updates.parentPostId || null) }

  const oldRow = db.prepare("SELECT stage, title FROM posts WHERE id = ?").get(id) as { stage: string; title: string } | undefined
  values.push(id)
  db.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  if (updates.stage && oldRow && updates.stage !== oldRow.stage) {
    logActivity({ entityType: "post", entityId: id, entityName: oldRow.title, action: "stage_changed", detail: `${oldRow.stage} → ${updates.stage}` })
  } else if (oldRow) {
    logActivity({ entityType: "post", entityId: id, entityName: oldRow.title, action: "updated" })
  }

  return getPostById(id)
}

export function deletePost(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT title FROM posts WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("DELETE FROM posts WHERE id = ?").run(id)
  logActivity({ entityType: "post", entityId: id, entityName: row?.title || "Unknown", action: "deleted" })
}

export function searchPosts(query: string, limit = 5): Post[] {
  const db = getDb()
  const term = `%${query}%`
  const rows = db.prepare(
    "SELECT * FROM posts WHERE title LIKE ? OR caption LIKE ? OR topic LIKE ? ORDER BY updatedAt DESC LIMIT ?"
  ).all(term, term, term, limit) as PostRow[]
  return rows.map((r) => rowToPost(r))
}
