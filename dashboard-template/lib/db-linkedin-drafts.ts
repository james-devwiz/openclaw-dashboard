// LinkedIn draft history — persist AI-generated drafts per thread

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { DraftHistoryEntry } from "@/types"

interface DraftRow {
  id: string; threadId: string; instruction: string
  variants: string; usedVariantIndex: number | null; createdAt: string
}

function rowToEntry(r: DraftRow): DraftHistoryEntry {
  let variants: string[] = []
  try { variants = JSON.parse(r.variants) } catch { /* empty */ }
  return {
    id: r.id, threadId: r.threadId, instruction: r.instruction || "",
    variants, usedVariantIndex: r.usedVariantIndex,
    createdAt: r.createdAt,
  }
}

export function saveDraftGeneration(
  threadId: string, instruction: string, variants: string[]
): DraftHistoryEntry {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO linkedin_draft_history (id, threadId, instruction, variants, createdAt)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, threadId, instruction || "", JSON.stringify(variants), now)
  return rowToEntry(db.prepare("SELECT * FROM linkedin_draft_history WHERE id = ?").get(id) as DraftRow)
}

export function getDraftHistory(threadId: string, limit = 20): DraftHistoryEntry[] {
  const db = getDb()
  const rows = db.prepare(
    "SELECT * FROM linkedin_draft_history WHERE threadId = ? ORDER BY createdAt DESC LIMIT ?"
  ).all(threadId, limit) as DraftRow[]
  return rows.map(rowToEntry)
}

export function markDraftUsed(id: string, variantIndex: number): void {
  const db = getDb()
  db.prepare("UPDATE linkedin_draft_history SET usedVariantIndex = ? WHERE id = ?")
    .run(variantIndex, id)
}
