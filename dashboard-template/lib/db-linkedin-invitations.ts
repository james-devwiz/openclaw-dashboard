// LinkedIn invitation processing — CRUD for processed invitations

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { ProcessedInvitation, InvitationDecision, InvitationStats } from "@/types"

interface InvitationRow {
  id: string; unipileInvitationId: string; inviterName: string
  inviterHeadline: string; inviterLocation: string; inviterProviderId: string
  invitationText: string; decision: string; reason: string; icpMatch: string
  threadId: string | null; messagesSent: number; processedAt: string
}

function rowToInvitation(r: InvitationRow): ProcessedInvitation {
  return {
    id: r.id, unipileInvitationId: r.unipileInvitationId,
    inviterName: r.inviterName, inviterHeadline: r.inviterHeadline || "",
    inviterLocation: r.inviterLocation || "", inviterProviderId: r.inviterProviderId || "",
    invitationText: r.invitationText || "", decision: r.decision as InvitationDecision,
    reason: r.reason || "", icpMatch: r.icpMatch || "",
    threadId: r.threadId || "", messagesSent: r.messagesSent || 0,
    processedAt: r.processedAt,
  }
}

export function getProcessedInvitationIds(): string[] {
  const db = getDb()
  const rows = db.prepare("SELECT unipileInvitationId FROM linkedin_invitations").all() as Array<{ unipileInvitationId: string }>
  return rows.map((r) => r.unipileInvitationId)
}

export function recordInvitation(input: {
  unipileInvitationId: string; inviterName: string; inviterHeadline?: string
  inviterLocation?: string; inviterProviderId?: string; invitationText?: string
  decision: InvitationDecision; reason: string; icpMatch?: string
}): ProcessedInvitation {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO linkedin_invitations (id, unipileInvitationId, inviterName, inviterHeadline,
     inviterLocation, inviterProviderId, invitationText, decision, reason, icpMatch, processedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, input.unipileInvitationId, input.inviterName, input.inviterHeadline || "",
    input.inviterLocation || "", input.inviterProviderId || "",
    input.invitationText || "", input.decision, input.reason, input.icpMatch || "", now,
  )
  return rowToInvitation(db.prepare("SELECT * FROM linkedin_invitations WHERE id = ?").get(id) as InvitationRow)
}

export function updateInvitationThread(id: string, threadId: string, messagesSent: number): void {
  const db = getDb()
  db.prepare("UPDATE linkedin_invitations SET threadId = ?, messagesSent = ? WHERE id = ?")
    .run(threadId, messagesSent, id)
}

export function getRecentInvitations(limit = 20, offset = 0): { invitations: ProcessedInvitation[]; total: number } {
  const db = getDb()
  const total = (db.prepare("SELECT COUNT(*) as c FROM linkedin_invitations").get() as { c: number }).c
  const rows = db.prepare(
    "SELECT * FROM linkedin_invitations ORDER BY processedAt DESC LIMIT ? OFFSET ?"
  ).all(limit, offset) as InvitationRow[]
  return { invitations: rows.map(rowToInvitation), total }
}

export function getInvitationStats(): InvitationStats {
  const db = getDb()
  const row = db.prepare(
    `SELECT
       SUM(CASE WHEN decision = 'accepted' THEN 1 ELSE 0 END) as accepted,
       SUM(CASE WHEN decision = 'declined' THEN 1 ELSE 0 END) as declined,
       SUM(CASE WHEN decision = 'error' THEN 1 ELSE 0 END) as errored,
       COUNT(*) as total
     FROM linkedin_invitations`
  ).get() as { accepted: number; declined: number; errored: number; total: number }
  return { accepted: row.accepted || 0, declined: row.declined || 0, errored: row.errored || 0, total: row.total || 0 }
}
