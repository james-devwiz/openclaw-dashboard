// Lead comment CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { LeadComment } from "@/types"

interface LeadCommentRow {
  id: string; leadId: string; content: string; source: string; createdAt: string
}

function rowToComment(row: LeadCommentRow): LeadComment {
  return {
    id: row.id, leadId: row.leadId, content: row.content,
    source: row.source as "user" | "openclaw", createdAt: row.createdAt,
  }
}

export function getLeadComments(leadId: string): LeadComment[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM lead_comments WHERE leadId = ? ORDER BY createdAt ASC")
    .all(leadId) as LeadCommentRow[]
  return rows.map(rowToComment)
}

export function createLeadComment(input: {
  leadId: string; content: string; source?: "user" | "openclaw"
}): LeadComment {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare("INSERT INTO lead_comments (id, leadId, content, source, createdAt) VALUES (?, ?, ?, ?, ?)")
    .run(id, input.leadId, input.content, input.source || "user", now)

  const lead = db.prepare("SELECT companyName FROM leads WHERE id = ?").get(input.leadId) as { companyName: string } | undefined
  logActivity({
    entityType: "lead", entityId: input.leadId,
    entityName: lead?.companyName || "Unknown", action: "updated", detail: "Comment added",
  })

  return rowToComment(db.prepare("SELECT * FROM lead_comments WHERE id = ?").get(id) as LeadCommentRow)
}

export function deleteLeadComment(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT leadId FROM lead_comments WHERE id = ?").get(id) as { leadId: string } | undefined
  db.prepare("DELETE FROM lead_comments WHERE id = ?").run(id)
  if (row) {
    const lead = db.prepare("SELECT companyName FROM leads WHERE id = ?").get(row.leadId) as { companyName: string } | undefined
    logActivity({
      entityType: "lead", entityId: row.leadId,
      entityName: lead?.companyName || "Unknown", action: "updated", detail: "Comment removed",
    })
  }
}
