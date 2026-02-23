// Post media CRUD — manages file attachments for posts

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { PostMedia } from "@/types/studio.types"

export function getMedia(postId: string): PostMedia[] {
  const db = getDb()
  return db.prepare(
    "SELECT * FROM post_media WHERE postId = ? ORDER BY sortOrder ASC"
  ).all(postId) as PostMedia[]
}

export function addMedia(input: {
  postId: string; mediaType: "image" | "video" | "document"
  filename: string; mimeType: string; fileSize: number
  filePath: string; sortOrder?: number; altText?: string
}): PostMedia {
  const db = getDb()
  const id = randomUUID()
  const maxOrder = (db.prepare(
    "SELECT MAX(sortOrder) as m FROM post_media WHERE postId = ?"
  ).get(input.postId) as { m: number | null })?.m ?? -1

  db.prepare(
    `INSERT INTO post_media (id, postId, mediaType, filename, mimeType, fileSize, filePath, sortOrder, altText)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, input.postId, input.mediaType, input.filename,
    input.mimeType, input.fileSize, input.filePath,
    input.sortOrder ?? maxOrder + 1, input.altText || "",
  )

  return db.prepare("SELECT * FROM post_media WHERE id = ?").get(id) as PostMedia
}

export function removeMedia(id: string): void {
  const db = getDb()
  db.prepare("DELETE FROM post_media WHERE id = ?").run(id)
}

export function reorderMedia(postId: string, mediaIds: string[]): void {
  const db = getDb()
  const stmt = db.prepare("UPDATE post_media SET sortOrder = ? WHERE id = ? AND postId = ?")
  for (let i = 0; i < mediaIds.length; i++) {
    stmt.run(i, mediaIds[i], postId)
  }
}
