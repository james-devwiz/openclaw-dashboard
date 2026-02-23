// Lead CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"
import { rowToLead, type LeadRow } from "./db-lead-queries"

import type { Lead, LeadStatus, LeadBusiness, LeadSource, LeadPriority } from "@/types"

// Re-export stats, call-list, and search from db-lead-queries
export { getLeadStats, getCallList, searchLeads, rowToLead, type LeadRow } from "./db-lead-queries"

interface GetLeadsOpts {
  status?: string; business?: string; source?: string; search?: string
  limit?: number; offset?: number
}

export function getLeads(opts?: GetLeadsOpts): Lead[] {
  const db = getDb()
  const conditions: string[] = ["1=1"]
  const params: (string | number)[] = []

  if (opts?.status) { conditions.push("status = ?"); params.push(opts.status) }
  if (opts?.business) { conditions.push("business = ?"); params.push(opts.business) }
  if (opts?.source) { conditions.push("source = ?"); params.push(opts.source) }
  if (opts?.search) {
    conditions.push("(companyName LIKE ? OR contactName LIKE ? OR notes LIKE ? OR tags LIKE ?)")
    const term = `%${opts.search}%`
    params.push(term, term, term, term)
  }

  const limit = opts?.limit || 100
  const offset = opts?.offset || 0
  params.push(limit, offset)

  const rows = db.prepare(
    `SELECT * FROM leads WHERE ${conditions.join(" AND ")} ORDER BY score DESC, createdAt DESC LIMIT ? OFFSET ?`
  ).all(...params) as LeadRow[]
  return rows.map(rowToLead)
}

export function getLeadById(id: string): Lead | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined
  return row ? rowToLead(row) : null
}

export function getLeadCount(opts?: GetLeadsOpts): number {
  const db = getDb()
  const conditions: string[] = ["1=1"]
  const params: string[] = []

  if (opts?.status) { conditions.push("status = ?"); params.push(opts.status) }
  if (opts?.business) { conditions.push("business = ?"); params.push(opts.business) }
  if (opts?.source) { conditions.push("source = ?"); params.push(opts.source) }
  if (opts?.search) {
    conditions.push("(companyName LIKE ? OR contactName LIKE ? OR notes LIKE ? OR tags LIKE ?)")
    const term = `%${opts.search}%`
    params.push(term, term, term, term)
  }

  return (db.prepare(
    `SELECT COUNT(*) as c FROM leads WHERE ${conditions.join(" AND ")}`
  ).get(...params) as { c: number }).c
}

export function createLead(input: {
  companyName: string; contactName?: string; contactTitle?: string
  email?: string; phone?: string; website?: string; linkedinUrl?: string
  location?: string; industry?: string; companySize?: string; estimatedRevenue?: string
  status?: LeadStatus; business?: LeadBusiness; priority?: LeadPriority
  score?: number; source?: LeadSource; notes?: string; signalType?: string
  signalDetail?: string; tags?: string; goalId?: string; logoUrl?: string
}): Lead {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO leads (id, companyName, contactName, contactTitle, email, phone, website,
     linkedinUrl, location, industry, companySize, estimatedRevenue, status, business, priority,
     score, source, notes, signalType, signalDetail, tags, goalId, logoUrl, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, input.companyName, input.contactName || "", input.contactTitle || "",
    input.email || "", input.phone || "", input.website || "", input.linkedinUrl || "",
    input.location || "", input.industry || "", input.companySize || "",
    input.estimatedRevenue || "", input.status || "New", input.business || "Business A",
    input.priority || "Medium", input.score || 0, input.source || "Manual",
    input.notes || "", input.signalType || "", input.signalDetail || "",
    input.tags || "", input.goalId || null, input.logoUrl || "", now, now
  )

  logActivity({ entityType: "lead", entityId: id, entityName: input.companyName, action: "created" })
  return rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow)
}

export function updateLead(id: string, updates: Partial<Omit<Lead, "id" | "createdAt">>): Lead | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = ["updatedAt = ?"]
  const values: (string | number | null)[] = [now]

  const stringFields = [
    "companyName", "contactName", "contactTitle", "email", "emailVerified", "phone",
    "website", "linkedinUrl", "location", "industry", "companySize", "estimatedRevenue",
    "status", "business", "priority", "source", "companyData", "enrichmentData",
    "notes", "nextAction", "nextActionDate", "lastContactedAt", "goalId",
    "signalType", "signalDetail", "tags", "logoUrl", "outreachDrafts", "researchSummary",
    "callOutcome", "callNotes", "followUpDrafts",
  ] as const

  for (const key of stringFields) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(updates[key] ?? null)
    }
  }
  if (updates.score !== undefined) { fields.push("score = ?"); values.push(updates.score) }
  if (updates.linkedinConnected !== undefined) {
    fields.push("linkedinConnected = ?"); values.push(updates.linkedinConnected ? 1 : 0)
  }

  values.push(id)
  db.prepare(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined
  if (row) {
    const action = updates.status ? "status_changed" : "updated"
    const detail = updates.status ? `Status: → ${updates.status}` : "Lead updated"
    logActivity({ entityType: "lead", entityId: id, entityName: row.companyName, action, detail })
    return rowToLead(row)
  }
  return null
}

export function deleteLead(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT companyName FROM leads WHERE id = ?").get(id) as { companyName: string } | undefined
  db.prepare("DELETE FROM leads WHERE id = ?").run(id)
  logActivity({ entityType: "lead", entityId: id, entityName: row?.companyName || "Unknown", action: "deleted" })
}

export function getLeadByLinkedinUrl(url: string): Lead | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM leads WHERE linkedinUrl = ?").get(url) as LeadRow | undefined
  return row ? rowToLead(row) : null
}
