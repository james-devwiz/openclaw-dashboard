// Lead stats, call-list, and search queries

import { getDb } from "./db"

import type { Lead, LeadStats } from "@/types"

/** Row type matching the leads table — shared with db-leads.ts */
export interface LeadRow {
  id: string; companyName: string; contactName: string; contactTitle: string
  email: string; emailVerified: string; phone: string; website: string
  linkedinUrl: string; location: string; industry: string; companySize: string
  estimatedRevenue: string; status: string; business: string; priority: string
  score: number; source: string; companyData: string; enrichmentData: string
  notes: string; nextAction: string; nextActionDate: string | null
  lastContactedAt: string | null; goalId: string | null; signalType: string
  signalDetail: string; tags: string; logoUrl: string; outreachDrafts: string
  researchSummary: string; callOutcome: string; callNotes: string
  followUpDrafts: string; linkedinConnected: number; createdAt: string; updatedAt: string
}

/** Convert a raw DB row to a Lead object — shared with db-leads.ts */
export function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id, companyName: row.companyName, contactName: row.contactName,
    contactTitle: row.contactTitle, email: row.email, emailVerified: row.emailVerified,
    phone: row.phone, website: row.website, linkedinUrl: row.linkedinUrl,
    location: row.location, industry: row.industry, companySize: row.companySize,
    estimatedRevenue: row.estimatedRevenue,
    status: row.status as Lead["status"],
    business: row.business as Lead["business"],
    priority: row.priority as Lead["priority"],
    score: row.score,
    source: row.source as Lead["source"],
    companyData: row.companyData, enrichmentData: row.enrichmentData,
    notes: row.notes, nextAction: row.nextAction,
    nextActionDate: row.nextActionDate || undefined,
    lastContactedAt: row.lastContactedAt || undefined,
    goalId: row.goalId || undefined, signalType: row.signalType,
    signalDetail: row.signalDetail, tags: row.tags,
    logoUrl: row.logoUrl || "", outreachDrafts: row.outreachDrafts || "",
    researchSummary: row.researchSummary || "",
    callOutcome: (row.callOutcome || "") as Lead["callOutcome"],
    callNotes: row.callNotes || "",
    followUpDrafts: row.followUpDrafts || "",
    linkedinConnected: !!row.linkedinConnected,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  }
}

export function getLeadStats(business?: string): LeadStats {
  const db = getDb()
  const where = business ? "WHERE business = ?" : "WHERE 1=1"
  const params = business ? [business] : []

  const total = (db.prepare(`SELECT COUNT(*) as c FROM leads ${where}`).get(...params) as { c: number }).c
  const qualified = (db.prepare(`SELECT COUNT(*) as c FROM leads ${where} AND status = 'Qualified'`).get(...params) as { c: number }).c

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const contactedThisWeek = (db.prepare(
    `SELECT COUNT(*) as c FROM leads ${where} AND lastContactedAt >= ?`
  ).get(...[...params, weekAgo]) as { c: number }).c

  const hotLeads = (db.prepare(`SELECT COUNT(*) as c FROM leads ${where} AND score >= 80`).get(...params) as { c: number }).c
  const avgRow = db.prepare(`SELECT AVG(score) as avg FROM leads ${where}`).get(...params) as { avg: number | null }

  return { total, qualified, contactedThisWeek, hotLeads, avgScore: Math.round(avgRow.avg || 0) }
}

export function getCallList(limit = 10): Lead[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM leads WHERE status IN ('Qualified', 'Outreach Ready')
     AND (phone != '' OR linkedinUrl != '' OR email != '')
     ORDER BY score DESC, createdAt ASC LIMIT ?`
  ).all(limit) as LeadRow[]
  return rows.map(rowToLead)
}

export function searchLeads(query: string, limit = 20): Lead[] {
  const db = getDb()
  const term = `%${query}%`
  const rows = db.prepare(
    `SELECT * FROM leads WHERE companyName LIKE ? OR contactName LIKE ? OR notes LIKE ? OR tags LIKE ? OR industry LIKE ?
     ORDER BY score DESC LIMIT ?`
  ).all(term, term, term, term, term, limit) as LeadRow[]
  return rows.map(rowToLead)
}
