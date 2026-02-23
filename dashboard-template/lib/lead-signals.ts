// Lead signal detection — automated discovery via Apollo + Bright Data

import { searchOrganizations, isApolloConfigured } from "./apollo"
import { mcporterCall } from "./mcporter"
import { ICPS } from "./lead-icp"
import { getLeads, createLead } from "./db-leads"
import { enrichLead } from "./lead-enrichment"
import { generateResearchSummary } from "./lead-outreach-gen"
import type { LeadBusiness } from "@/types"

interface DiscoveryResult {
  created: number
  enriched: number
  skipped: number
  errors: string[]
  leadIds: string[]
}

/** Discover new leads for a specific business or all businesses */
export async function findLeads(opts: {
  business?: LeadBusiness
  limit?: number
  autoEnrich?: boolean
}): Promise<DiscoveryResult> {
  const limit = opts.limit || 10
  const businesses = opts.business ? [opts.business] : (Object.keys(ICPS) as LeadBusiness[])
  const perBusiness = Math.ceil(limit / businesses.length)

  const result: DiscoveryResult = { created: 0, enriched: 0, skipped: 0, errors: [], leadIds: [] }

  // Collect existing company names and domains for dedup
  const existing = getLeads({ limit: 500 })
  const existingNames = new Set(existing.map((l) => normalise(l.companyName)))
  const existingDomains = new Set(
    existing.map((l) => extractDomain(l.website)).filter(Boolean)
  )

  for (const biz of businesses) {
    const icp = ICPS[biz]
    const rawLeads: RawLead[] = []

    // Strategy 1: Apollo org search
    if (isApolloConfigured()) {
      try {
        const orgs = await searchOrganizations({
          keywords: icp.keywords.slice(0, 5),
          minRevenue: icp.minRevenue || undefined,
          limit: perBusiness,
        })
        for (const org of orgs) {
          rawLeads.push({
            companyName: org.name,
            website: org.website_url,
            linkedinUrl: org.linkedin_url,
            logoUrl: org.logo_url,
            industry: org.industry,
            location: [org.city, org.state, org.country].filter(Boolean).join(", "),
            companySize: org.estimated_num_employees ? `${org.estimated_num_employees}` : "",
            estimatedRevenue: org.annual_revenue ? formatRevenue(org.annual_revenue) : "",
            source: "Apollo" as const,
            signalType: "icp_match",
            signalDetail: `Apollo org search: ${icp.keywords[0]}`,
          })
        }
      } catch (err) {
        result.errors.push(`Apollo search (${biz}): ${err instanceof Error ? err.message : "failed"}`)
      }
    }

    // Strategy 2: Bright Data search engine
    try {
      const query = buildSearchQuery(icp)
      const { result: searchResult } = await mcporterCall("bright-data", "search_engine", {
        query,
        count: perBusiness,
      })
      const entries = parseSearchResults(searchResult)
      for (const entry of entries) {
        rawLeads.push({
          companyName: entry.title,
          website: entry.url,
          source: "Bright Data" as const,
          signalType: "search_discovery",
          signalDetail: `Search: "${query.slice(0, 60)}"`,
        })
      }
    } catch (err) {
      result.errors.push(`Bright Data search (${biz}): ${err instanceof Error ? err.message : "failed"}`)
    }

    // Dedup and create
    for (const raw of rawLeads) {
      if (result.created >= limit) break
      const name = normalise(raw.companyName)
      const domain = extractDomain(raw.website || "")

      if (existingNames.has(name) || (domain && existingDomains.has(domain))) {
        result.skipped++
        continue
      }

      existingNames.add(name)
      if (domain) existingDomains.add(domain)

      const lead = createLead({
        companyName: raw.companyName,
        website: raw.website || "",
        linkedinUrl: raw.linkedinUrl || "",
        logoUrl: raw.logoUrl || "",
        industry: raw.industry || "",
        location: raw.location || "",
        companySize: raw.companySize || "",
        estimatedRevenue: raw.estimatedRevenue || "",
        business: biz,
        source: raw.source,
        signalType: raw.signalType || "",
        signalDetail: raw.signalDetail || "",
        status: "New",
      })

      result.created++
      result.leadIds.push(lead.id)

      // Fire-and-forget research summary generation
      generateResearchSummary(lead.id).catch((err) => {
        console.error(`Research summary failed for ${raw.companyName}:`, err)
      })

      // Auto-enrich if requested
      if (opts.autoEnrich !== false) {
        try {
          await enrichLead(lead.id)
          result.enriched++
        } catch (err) {
          result.errors.push(`Enrich ${raw.companyName}: ${err instanceof Error ? err.message : "failed"}`)
        }
      }
    }
  }

  return result
}

// --- Internal helpers ---

interface RawLead {
  companyName: string
  website?: string
  linkedinUrl?: string
  logoUrl?: string
  industry?: string
  location?: string
  companySize?: string
  estimatedRevenue?: string
  source: "Apollo" | "Bright Data"
  signalType?: string
  signalDetail?: string
}

function buildSearchQuery(icp: typeof ICPS[LeadBusiness]): string {
  const terms = icp.keywords.slice(0, 3).join(" OR ")
  const exclude = icp.excludeKeywords.slice(0, 2).map((k) => `-"${k}"`).join(" ")
  return `${terms} ${icp.description.split(" ").slice(0, 4).join(" ")} ${exclude}`.trim()
}

function parseSearchResults(raw: unknown): Array<{ title: string; url: string }> {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .filter((r) => r && typeof r === "object" && "title" in r && "url" in r)
      .map((r) => ({ title: String(r.title || ""), url: String(r.url || "") }))
      .filter((r) => r.title && r.url)
  }
  if (typeof raw === "object" && raw !== null && "results" in raw) {
    return parseSearchResults((raw as { results: unknown }).results)
  }
  return []
}

function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

function extractDomain(url: string): string | null {
  if (!url) return null
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "")
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
