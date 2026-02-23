// Lead enrichment pipeline — orchestrates Apollo + Bright Data + scoring

import { getLeadById, updateLead } from "./db-leads"
import { enrichOrganization, searchPeople, isApolloConfigured } from "./apollo"
import { mcporterCall } from "./mcporter"
import { ICPS } from "./lead-icp"
import type { Lead, LeadBusiness } from "@/types"

interface EnrichmentResult {
  lead: Lead
  sources: string[]
  errors: string[]
}

/** Full enrichment pipeline for a single lead */
export async function enrichLead(leadId: string): Promise<EnrichmentResult> {
  const lead = getLeadById(leadId)
  if (!lead) throw new Error("Lead not found")

  const sources: string[] = []
  const errors: string[] = []
  const updates: Partial<Lead> = { status: "Researching" }

  // 1. Apollo org enrichment (if domain available)
  const domain = extractDomain(lead.website)
  if (domain && isApolloConfigured()) {
    try {
      const org = await enrichOrganization(domain)
      if (org) {
        sources.push("apollo-org")
        if (org.logo_url) updates.logoUrl = org.logo_url
        if (!lead.industry && org.industry) updates.industry = org.industry
        if (!lead.companySize && org.estimated_num_employees) {
          updates.companySize = `${org.estimated_num_employees} employees`
        }
        if (!lead.estimatedRevenue && org.annual_revenue) {
          updates.estimatedRevenue = formatRevenue(org.annual_revenue)
        }
        if (!lead.location && org.country) {
          updates.location = [org.city, org.state, org.country].filter(Boolean).join(", ")
        }
        if (!lead.linkedinUrl && org.linkedin_url) updates.linkedinUrl = org.linkedin_url
        mergeCompanyData(updates, { apollo: org })
      }
    } catch (err) {
      errors.push(`Apollo org: ${err instanceof Error ? err.message : "failed"}`)
    }
  }

  // 2. Apollo people search (find decision makers)
  if (isApolloConfigured() && (domain || lead.companyName)) {
    try {
      const people = await searchPeople({
        domain: domain || undefined,
        companyName: !domain ? lead.companyName : undefined,
        limit: 3,
      })
      if (people.length > 0) {
        sources.push("apollo-people")
        const best = people[0]
        if (!lead.contactName && best.name) updates.contactName = best.name
        if (!lead.contactTitle && best.title) updates.contactTitle = best.title
        if (!lead.email && best.email) updates.email = best.email
        if (!lead.phone && best.phone_numbers?.length) {
          updates.phone = best.phone_numbers[0].raw_number
        }
        if (!lead.linkedinUrl && best.linkedin_url) updates.linkedinUrl = best.linkedin_url
        if (!lead.location && best.country) {
          updates.location = [best.city, best.state, best.country].filter(Boolean).join(", ")
        }
        mergeEnrichmentData(updates, lead, { apolloPeople: people })
      }
    } catch (err) {
      errors.push(`Apollo people: ${err instanceof Error ? err.message : "failed"}`)
    }
  }

  // 3. Bright Data website scrape (about page content)
  if (lead.website) {
    try {
      const { result } = await mcporterCall("bright-data", "scrape_as_markdown", {
        url: lead.website,
      })
      if (result && typeof result === "string" && result.length > 50) {
        sources.push("bright-data-scrape")
        mergeEnrichmentData(updates, lead, { websiteContent: result.slice(0, 2000) })
      }
    } catch (err) {
      errors.push(`Bright Data scrape: ${err instanceof Error ? err.message : "failed"}`)
    }
  }

  // 4. Calculate score
  const merged = { ...lead, ...updates }
  updates.score = calculateLeadScore(merged)

  // 5. Set status based on enrichment quality
  const hasContact = !!(merged.contactName || merged.email || merged.phone)
  if (!hasContact) {
    updates.status = "Archived"
  } else if (updates.score >= 50 && (merged.phone || merged.email)) {
    updates.status = "Qualified"
  }

  // Save all updates
  const updated = updateLead(leadId, updates)
  if (!updated) throw new Error("Failed to save enrichment")

  return { lead: updated, sources, errors }
}

/** Score a lead based on available data — max 100 */
export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 0

  // Contact quality (40 points max)
  if (lead.phone) score += 20
  if (lead.email) score += 10
  if (lead.contactName) score += 5
  if (lead.contactTitle) score += 5

  // Company data (30 points max)
  if (lead.website) score += 5
  if (lead.linkedinUrl) score += 5
  if (lead.industry) score += 5
  if (lead.estimatedRevenue) score += 10
  if (lead.companySize) score += 5

  // ICP match (20 points max)
  if (lead.business && ICPS[lead.business]) {
    const icp = ICPS[lead.business]
    const rev = parseRevenue(lead.estimatedRevenue || "")
    if (rev >= icp.minRevenue) score += 10
    const industryMatch = icp.industries.some((i) =>
      (lead.industry || "").toLowerCase().includes(i.toLowerCase())
    )
    if (industryMatch) score += 10
  }

  // Signal quality (10 points max)
  if (lead.signalType) score += 5
  if (lead.signalDetail) score += 5

  return Math.min(score, 100)
}

function extractDomain(url: string): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname
    return hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

function parseRevenue(str: string): number {
  const match = str.match(/\$?([\d.]+)\s*(B|M|K)?/i)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = (match[2] || "").toUpperCase()
  if (unit === "B") return num * 1_000_000_000
  if (unit === "M") return num * 1_000_000
  if (unit === "K") return num * 1_000
  return num
}

function mergeCompanyData(updates: Partial<Lead>, data: Record<string, unknown>): void {
  const existing = updates.companyData ? JSON.parse(updates.companyData) : {}
  updates.companyData = JSON.stringify({ ...existing, ...data })
}

function mergeEnrichmentData(
  updates: Partial<Lead>, lead: Lead, data: Record<string, unknown>
): void {
  const existing = lead.enrichmentData ? JSON.parse(lead.enrichmentData) : {}
  const prev = updates.enrichmentData ? JSON.parse(updates.enrichmentData) : {}
  updates.enrichmentData = JSON.stringify({ ...existing, ...prev, ...data })
}
