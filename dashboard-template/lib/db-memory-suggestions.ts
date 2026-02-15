// CRUD operations for memory_suggestions table

import { randomUUID } from "crypto"
import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import type { MemorySuggestion, SuggestionStatus } from "@/types/memory.types"

export function getSuggestions(status?: SuggestionStatus): MemorySuggestion[] {
  const db = getDb()
  if (status) {
    return db.prepare("SELECT * FROM memory_suggestions WHERE status = ? ORDER BY createdAt DESC").all(status) as MemorySuggestion[]
  }
  return db.prepare("SELECT * FROM memory_suggestions ORDER BY createdAt DESC").all() as MemorySuggestion[]
}

export function createSuggestion(input: {
  title: string
  content: string
  sourceType?: string
  sourceId?: string
  reason?: string
  targetCategory?: string
  targetFile?: string
}): MemorySuggestion {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO memory_suggestions (id, title, content, sourceType, sourceId, reason, status, targetCategory, targetFile, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).run(id, input.title, input.content, input.sourceType || "manual", input.sourceId || "", input.reason || "", input.targetCategory || "memory", input.targetFile || "", now)

  logActivity({
    entityType: "memory",
    entityId: id,
    entityName: input.title,
    action: "created",
    detail: "Memory suggestion created",
  })

  return { id, ...input, sourceType: input.sourceType || "manual", sourceId: input.sourceId || "", reason: input.reason || "", status: "pending", targetCategory: input.targetCategory || "memory", targetFile: input.targetFile || "", createdAt: now }
}

export function updateSuggestionStatus(id: string, status: SuggestionStatus): void {
  const db = getDb()
  const existing = db.prepare("SELECT title FROM memory_suggestions WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("UPDATE memory_suggestions SET status = ? WHERE id = ?").run(status, id)

  logActivity({
    entityType: "memory",
    entityId: id,
    entityName: existing?.title || id,
    action: "status_changed",
    detail: `Suggestion ${status}`,
  })
}

export function deleteSuggestion(id: string): void {
  const db = getDb()
  const existing = db.prepare("SELECT title FROM memory_suggestions WHERE id = ?").get(id) as { title: string } | undefined
  db.prepare("DELETE FROM memory_suggestions WHERE id = ?").run(id)

  logActivity({
    entityType: "memory",
    entityId: id,
    entityName: existing?.title || id,
    action: "deleted",
  })
}
