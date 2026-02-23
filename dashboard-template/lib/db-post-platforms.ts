// Post platforms CRUD — manages per-platform publishing state

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { PostPlatformEntry, PostPlatform, PlatformStatus } from "@/types/studio.types"

export function getPlatforms(postId: string): PostPlatformEntry[] {
  const db = getDb()
  return db.prepare("SELECT * FROM post_platforms WHERE postId = ?").all(postId) as PostPlatformEntry[]
}

export function addPlatform(postId: string, platform: PostPlatform, captionOverride?: string): PostPlatformEntry {
  const db = getDb()
  const id = randomUUID()
  db.prepare(
    "INSERT INTO post_platforms (id, postId, platform, platformStatus, captionOverride) VALUES (?, ?, ?, 'draft', ?)"
  ).run(id, postId, platform, captionOverride || "")

  const title = (db.prepare("SELECT title FROM posts WHERE id = ?").get(postId) as { title: string })?.title || ""
  logActivity({ entityType: "post", entityId: postId, entityName: title, action: "updated", detail: `Added ${platform} platform` })

  return db.prepare("SELECT * FROM post_platforms WHERE id = ?").get(id) as PostPlatformEntry
}

export function updatePlatform(id: string, updates: {
  platformStatus?: PlatformStatus; scheduledAt?: string | null
  publishedAt?: string | null; publishedUrl?: string
  platformPostId?: string; captionOverride?: string
  approvalId?: string; error?: string
}): PostPlatformEntry | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | null)[] = []

  if (updates.platformStatus !== undefined) { fields.push("platformStatus = ?"); values.push(updates.platformStatus) }
  if (updates.scheduledAt !== undefined) { fields.push("scheduledAt = ?"); values.push(updates.scheduledAt) }
  if (updates.publishedAt !== undefined) { fields.push("publishedAt = ?"); values.push(updates.publishedAt) }
  if (updates.publishedUrl !== undefined) { fields.push("publishedUrl = ?"); values.push(updates.publishedUrl) }
  if (updates.platformPostId !== undefined) { fields.push("platformPostId = ?"); values.push(updates.platformPostId) }
  if (updates.captionOverride !== undefined) { fields.push("captionOverride = ?"); values.push(updates.captionOverride) }
  if (updates.approvalId !== undefined) { fields.push("approvalId = ?"); values.push(updates.approvalId) }
  if (updates.error !== undefined) { fields.push("error = ?"); values.push(updates.error) }

  if (fields.length === 0) return null
  values.push(id)
  db.prepare(`UPDATE post_platforms SET ${fields.join(", ")} WHERE id = ?`).run(...values)
  return db.prepare("SELECT * FROM post_platforms WHERE id = ?").get(id) as PostPlatformEntry | null
}

export function removePlatform(id: string): void {
  const db = getDb()
  db.prepare("DELETE FROM post_platforms WHERE id = ?").run(id)
}

export function getScheduledPlatforms(): (PostPlatformEntry & { postTitle: string; caption: string })[] {
  const db = getDb()
  return db.prepare(
    `SELECT pp.*, p.title as postTitle, p.caption
     FROM post_platforms pp JOIN posts p ON pp.postId = p.id
     WHERE pp.platformStatus = 'scheduled' AND pp.scheduledAt IS NOT NULL
     ORDER BY pp.scheduledAt ASC`
  ).all() as (PostPlatformEntry & { postTitle: string; caption: string })[]
}
