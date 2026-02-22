// Document CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Document, DocumentCategory } from "@/types"

interface DocRow {
  id: string
  category: string
  title: string
  content: string
  tags: string
  source: string
  createdAt: string
  updatedAt: string
}

function rowToDoc(row: DocRow): Document {
  return {
    id: row.id,
    category: row.category as DocumentCategory,
    title: row.title,
    content: row.content,
    tags: row.tags,
    source: row.source as Document["source"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function getDocuments(opts?: { category?: string; search?: string; limit?: number; offset?: number }): Document[] {
  const db = getDb()
  const conditions: string[] = ["1=1"]
  const params: (string | number)[] = []

  if (opts?.category) {
    conditions.push("category = ?")
    params.push(opts.category)
  }
  if (opts?.search) {
    conditions.push("(title LIKE ? OR tags LIKE ? OR content LIKE ?)")
    const term = `%${opts.search}%`
    params.push(term, term, term)
  }

  const limit = opts?.limit || 50
  const offset = opts?.offset || 0
  params.push(limit, offset)

  const rows = db.prepare(
    `SELECT * FROM documents WHERE ${conditions.join(" AND ")} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).all(...params) as DocRow[]
  return rows.map(rowToDoc)
}

export function getDocumentCount(opts?: { category?: string; search?: string }): number {
  const db = getDb()
  const conditions: string[] = ["1=1"]
  const params: string[] = []

  if (opts?.category) {
    conditions.push("category = ?")
    params.push(opts.category)
  }
  if (opts?.search) {
    conditions.push("(title LIKE ? OR tags LIKE ? OR content LIKE ?)")
    const term = `%${opts.search}%`
    params.push(term, term, term)
  }

  return (db.prepare(`SELECT COUNT(*) as c FROM documents WHERE ${conditions.join(" AND ")}`).get(...params) as { c: number }).c
}

export function getDocumentById(id: string): Document | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as DocRow | undefined
  return row ? rowToDoc(row) : null
}

export function createDocument(input: {
  category?: DocumentCategory
  title: string
  content?: string
  tags?: string
  source?: Document["source"]
}): Document {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO documents (id, category, title, content, tags, source, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.category || "Notes", input.title, input.content || "", input.tags || "", input.source || "manual", now, now)

  logActivity({ entityType: "content", entityId: id, entityName: input.title, action: "created", detail: `Document: ${input.category || "Notes"}` })
  return rowToDoc(db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as DocRow)
}

export function updateDocument(
  id: string,
  updates: Partial<Pick<Document, "category" | "title" | "content" | "tags">>
): Document | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | null)[] = [now]

  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category) }
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title) }
  if (updates.content !== undefined) { fields.push("content = ?"); values.push(updates.content) }
  if (updates.tags !== undefined) { fields.push("tags = ?"); values.push(updates.tags) }

  values.push(id)
  db.prepare(`UPDATE documents SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as DocRow | undefined
  if (row) {
    logActivity({ entityType: "content", entityId: id, entityName: row.title, action: "updated", detail: "Document updated" })
    return rowToDoc(row)
  }
  return null
}

export function deleteDocument(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT title FROM documents WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("DELETE FROM documents WHERE id = ?").run(id)
  logActivity({ entityType: "content", entityId: id, entityName: row?.title || "Unknown", action: "deleted", detail: "Document deleted" })
}
