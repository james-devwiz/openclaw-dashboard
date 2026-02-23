// Document search, count, and folder/project/agent queries (extracted from db-documents.ts for 200-line limit)

import { getDb } from "./db"

import type { Document, DocumentCategory, DocumentFolder } from "@/types"

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

export interface GetDocumentsOpts {
  category?: string
  search?: string
  folder?: string
  projectId?: string
  agentId?: string
  limit?: number
  offset?: number
}

function buildConditions(opts?: GetDocumentsOpts): { conditions: string[]; params: string[] } {
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
  if (opts?.folder === "general") {
    conditions.push("folder = 'general' AND projectId IS NULL AND agentId IS NULL")
  } else if (opts?.folder === "system") {
    conditions.push("folder = 'system'")
  }
  if (opts?.projectId) {
    conditions.push("projectId = ?")
    params.push(opts.projectId)
  }
  if (opts?.agentId) {
    conditions.push("agentId = ?")
    params.push(opts.agentId)
  }

  return { conditions, params }
}

export function getDocuments(opts?: GetDocumentsOpts): Document[] {
  const db = getDb()
  const { conditions, params } = buildConditions(opts)

  const limit = opts?.limit || 50
  const offset = opts?.offset || 0
  const allParams: (string | number)[] = [...params, limit, offset]

  const rows = db.prepare(
    `SELECT * FROM documents WHERE ${conditions.join(" AND ")} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).all(...allParams) as DocRow[]
  return rows.map(rowToDoc)
}

export function getDocumentCount(opts?: GetDocumentsOpts): number {
  const db = getDb()
  const { conditions, params } = buildConditions(opts)

  return (db.prepare(
    `SELECT COUNT(*) as c FROM documents WHERE ${conditions.join(" AND ")}`
  ).get(...params) as { c: number }).c
}

export function getDocumentFolderCounts(): { general: number; system: number } {
  const db = getDb()
  const general = (db.prepare(
    "SELECT COUNT(*) as c FROM documents WHERE folder = 'general' AND projectId IS NULL AND agentId IS NULL"
  ).get() as { c: number }).c
  const system = (db.prepare(
    "SELECT COUNT(*) as c FROM documents WHERE folder = 'system'"
  ).get() as { c: number }).c
  return { general, system }
}

export function getDocumentProjectCounts(): Array<{ projectId: string; name: string; count: number }> {
  const db = getDb()
  return db.prepare(
    `SELECT d.projectId, p.name, COUNT(*) as count
     FROM documents d JOIN projects p ON d.projectId = p.id
     WHERE d.projectId IS NOT NULL
     GROUP BY d.projectId`
  ).all() as Array<{ projectId: string; name: string; count: number }>
}

export function getDocumentAgentCounts(): Array<{ agentId: string; count: number }> {
  const db = getDb()
  return db.prepare(
    `SELECT agentId, COUNT(*) as count FROM documents
     WHERE agentId IS NOT NULL GROUP BY agentId`
  ).all() as Array<{ agentId: string; count: number }>
}
