// Lead activity CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { LeadActivity, LeadActivityType } from "@/types"

interface LeadActivityRow {
  id: string; leadId: string; activityType: string
  content: string; outcome: string; createdAt: string
}

function rowToActivity(row: LeadActivityRow): LeadActivity {
  return {
    id: row.id, leadId: row.leadId,
    activityType: row.activityType as LeadActivityType,
    content: row.content, outcome: row.outcome, createdAt: row.createdAt,
  }
}

export function getLeadActivities(leadId: string): LeadActivity[] {
  const db = getDb()
  const rows = db.prepare(
    "SELECT * FROM lead_activities WHERE leadId = ? ORDER BY createdAt DESC"
  ).all(leadId) as LeadActivityRow[]
  return rows.map(rowToActivity)
}

export function createLeadActivity(input: {
  leadId: string; activityType: LeadActivityType; content: string; outcome?: string
}): LeadActivity {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO lead_activities (id, leadId, activityType, content, outcome, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.leadId, input.activityType, input.content, input.outcome || "", now)

  return rowToActivity(db.prepare("SELECT * FROM lead_activities WHERE id = ?").get(id) as LeadActivityRow)
}

export function deleteLeadActivity(id: string): void {
  const db = getDb()
  db.prepare("DELETE FROM lead_activities WHERE id = ?").run(id)
}
