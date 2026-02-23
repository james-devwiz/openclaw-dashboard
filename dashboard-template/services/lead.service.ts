import { apiFetch } from "@/lib/api-client"
import type { Lead, LeadStatus, LeadBusiness, LeadSource, LeadPriority, LeadStats, LeadActivity, LeadComment } from "@/types"

const BASE = "/api/leads"

export async function getLeadsApi(opts?: {
  status?: string; business?: string; source?: string; search?: string; limit?: number; offset?: number
}): Promise<{ leads: Lead[]; total: number }> {
  const params = new URLSearchParams()
  if (opts?.status) params.set("status", opts.status)
  if (opts?.business) params.set("business", opts.business)
  if (opts?.source) params.set("source", opts.source)
  if (opts?.search) params.set("search", opts.search)
  if (opts?.limit) params.set("limit", String(opts.limit))
  if (opts?.offset) params.set("offset", String(opts.offset))
  const res = await apiFetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`Leads fetch failed: ${res.status}`)
  return res.json()
}

export async function getLeadStatsApi(business?: string): Promise<LeadStats> {
  const params = new URLSearchParams({ stats: "true" })
  if (business) params.set("business", business)
  const res = await apiFetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error("Stats fetch failed")
  const data = await res.json()
  return data.stats
}

export async function getCallListApi(limit = 10): Promise<Lead[]> {
  const res = await apiFetch(`${BASE}?callList=true&limit=${limit}`)
  if (!res.ok) throw new Error("Call list fetch failed")
  const data = await res.json()
  return data.leads
}

export async function createLeadApi(input: {
  companyName: string; contactName?: string; contactTitle?: string
  email?: string; phone?: string; website?: string; business?: LeadBusiness
  notes?: string; source?: LeadSource; priority?: LeadPriority
}): Promise<Lead> {
  const res = await apiFetch(BASE, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create lead")
  const data = await res.json()
  return data.lead
}

export async function updateLeadApi(
  leadId: string, updates: Partial<Lead>
): Promise<Lead> {
  const res = await apiFetch(BASE, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update lead")
  const data = await res.json()
  return data.lead
}

export async function deleteLeadApi(leadId: string): Promise<void> {
  const res = await apiFetch(`${BASE}?id=${encodeURIComponent(leadId)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete lead")
}

export async function exportLeadsCsvApi(ids?: string[]): Promise<Blob> {
  const params = ids?.length ? `?ids=${ids.join(",")}` : ""
  const res = await apiFetch(`${BASE}/export${params}`)
  if (!res.ok) throw new Error("Export failed")
  return res.blob()
}

export async function getLeadActivitiesApi(leadId: string): Promise<LeadActivity[]> {
  const res = await apiFetch(`${BASE}/activities?leadId=${encodeURIComponent(leadId)}`)
  if (!res.ok) throw new Error("Activities fetch failed")
  const data = await res.json()
  return data.activities
}

export async function createLeadActivityApi(input: {
  leadId: string; activityType: string; content: string; outcome?: string
}): Promise<LeadActivity> {
  const res = await apiFetch(`${BASE}/activities`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create activity")
  const data = await res.json()
  return data.activity
}

export async function enrichLeadApi(leadId: string): Promise<{
  lead: Lead; sources: string[]; errors: string[]
}> {
  const res = await apiFetch(`${BASE}/enrich`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!res.ok) throw new Error("Enrichment failed")
  return res.json()
}

export async function findLeadsApi(opts?: {
  business?: LeadBusiness; limit?: number; autoEnrich?: boolean
}): Promise<{
  created: number; enriched: number; skipped: number; errors: string[]; leadIds: string[]
}> {
  const res = await apiFetch(`${BASE}/find`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts || {}),
  })
  if (!res.ok) throw new Error("Lead discovery failed")
  return res.json()
}

export async function generateOutreachApi(leadId: string): Promise<{
  lead: Lead; drafts: unknown
}> {
  const res = await apiFetch(`${BASE}/generate-outreach`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!res.ok) throw new Error("Outreach generation failed")
  return res.json()
}

export async function getLeadCommentsApi(leadId: string): Promise<LeadComment[]> {
  const res = await apiFetch(`${BASE}/comments?leadId=${encodeURIComponent(leadId)}`)
  if (!res.ok) throw new Error("Comments fetch failed")
  const data = await res.json()
  return data.comments
}

export async function createLeadCommentApi(input: {
  leadId: string; content: string; source?: "user" | "openclaw"
}): Promise<LeadComment> {
  const res = await apiFetch(`${BASE}/comments`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create comment")
  const data = await res.json()
  return data.comment
}

export async function deleteLeadCommentApi(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete comment")
}

export async function generateResearchSummaryApi(leadId: string): Promise<Lead> {
  const res = await apiFetch(`${BASE}/research-summary`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!res.ok) throw new Error("Research summary generation failed")
  const data = await res.json()
  return data.lead
}

export async function executeOutreachApi(leadId: string): Promise<Lead> {
  const res = await apiFetch(`${BASE}/execute-outreach`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!res.ok) throw new Error("Execute outreach failed")
  const data = await res.json()
  return data.lead
}

export async function logCallOutcomeApi(
  leadId: string, outcome: string, notes: string
): Promise<Lead> {
  const res = await apiFetch(`${BASE}/call-outcome`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, outcome, notes }),
  })
  if (!res.ok) throw new Error("Log call outcome failed")
  const data = await res.json()
  return data.lead
}

export async function executeFollowUpApi(leadId: string): Promise<Lead> {
  const res = await apiFetch(`${BASE}/execute-followup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!res.ok) throw new Error("Execute follow-up failed")
  const data = await res.json()
  return data.lead
}
