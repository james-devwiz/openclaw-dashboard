// Document CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Document, DocumentCategory, DocumentFolder } from "@/types"

// Re-export search + count helpers so consumers don't need to change imports
export {
  getDocuments, getDocumentCount, getDocumentFolderCounts,
  getDocumentProjectCounts, getDocumentAgentCounts,
} from "./db-document-search"
export type { GetDocumentsOpts } from "./db-document-search"

interface DocRow {
  id: string
  category: string
  folder: string
  projectId: string | null
  agentId: string | null
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
    folder: (row.folder || "general") as DocumentFolder,
    projectId: row.projectId || undefined,
    agentId: row.agentId || undefined,
    title: row.title,
    content: row.content,
    tags: row.tags,
    source: row.source as Document["source"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
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
  folder?: DocumentFolder
  projectId?: string
  agentId?: string
}): Document {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  const folder = input.projectId ? "general" : input.agentId ? "general" : (input.folder || "general")

  db.prepare(
    `INSERT INTO documents (id, category, folder, projectId, agentId, title, content, tags, source, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, input.category || "Notes", folder,
    input.projectId || null, input.agentId || null,
    input.title, input.content || "", input.tags || "",
    input.source || "manual", now, now
  )

  logActivity({ entityType: "content", entityId: id, entityName: input.title, action: "created", detail: `Document: ${input.category || "Notes"}` })
  return rowToDoc(db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as DocRow)
}

export function updateDocument(
  id: string,
  updates: Partial<Pick<Document, "category" | "title" | "content" | "tags" | "folder" | "projectId" | "agentId">>
): Document | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | null)[] = [now]

  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category) }
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title) }
  if (updates.content !== undefined) { fields.push("content = ?"); values.push(updates.content) }
  if (updates.tags !== undefined) { fields.push("tags = ?"); values.push(updates.tags) }
  if (updates.folder !== undefined) { fields.push("folder = ?"); values.push(updates.folder) }

  // Mutual exclusivity: setting projectId clears agentId and vice versa
  if (updates.projectId !== undefined) {
    fields.push("projectId = ?"); values.push(updates.projectId || null)
    fields.push("agentId = ?"); values.push(null)
  } else if (updates.agentId !== undefined) {
    fields.push("agentId = ?"); values.push(updates.agentId || null)
    fields.push("projectId = ?"); values.push(null)
  }

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
