// Apollo.io REST API wrapper for lead enrichment and discovery

// Re-export search functions so consumers can still import from "@/lib/apollo"
export { searchOrganizations, searchPeople } from "./apollo-search"

const API_BASE = "https://api.apollo.io/api/v1"

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY
  if (!key) throw new Error("APOLLO_API_KEY not configured")
  return key
}

async function apolloFetch(path: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": getApiKey() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Apollo API ${path} failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json()
}

export interface ApolloOrg {
  id: string
  name: string
  website_url: string
  linkedin_url: string
  logo_url: string
  estimated_num_employees: number
  industry: string
  keywords: string[]
  annual_revenue: number | null
  city: string
  state: string
  country: string
}

export interface ApolloPerson {
  id: string
  first_name: string
  last_name: string
  name: string
  title: string
  email: string
  email_status: string
  linkedin_url: string
  phone_numbers: Array<{ raw_number: string; type: string }>
  organization: { name: string; website_url: string } | null
  city: string
  state: string
  country: string
}

/** Enrich a person by email or LinkedIn URL */
export async function enrichPerson(opts: {
  email?: string
  linkedinUrl?: string
}): Promise<ApolloPerson | null> {
  const body: Record<string, unknown> = {}
  if (opts.email) body.email = opts.email
  if (opts.linkedinUrl) body.linkedin_url = opts.linkedinUrl

  if (!body.email && !body.linkedin_url) return null

  const data = await apolloFetch("/people/match", body) as { person?: ApolloPerson }
  if (!data.person) return null

  const p = data.person
  return {
    id: p.id || "",
    first_name: p.first_name || "",
    last_name: p.last_name || "",
    name: p.name || "",
    title: p.title || "",
    email: p.email || "",
    email_status: p.email_status || "unknown",
    linkedin_url: p.linkedin_url || "",
    phone_numbers: p.phone_numbers || [],
    organization: p.organization || null,
    city: p.city || "",
    state: p.state || "",
    country: p.country || "",
  }
}

/** Enrich a company by domain */
export async function enrichOrganization(domain: string): Promise<ApolloOrg | null> {
  const data = await apolloFetch("/organizations/enrich", {
    domain,
  }) as { organization?: ApolloOrg }

  if (!data.organization) return null
  const org = data.organization
  return {
    id: org.id || "",
    name: org.name || "",
    website_url: org.website_url || "",
    linkedin_url: org.linkedin_url || "",
    logo_url: org.logo_url || "",
    estimated_num_employees: org.estimated_num_employees || 0,
    industry: org.industry || "",
    keywords: org.keywords || [],
    annual_revenue: org.annual_revenue || null,
    city: org.city || "",
    state: org.state || "",
    country: org.country || "",
  }
}

/** Check if Apollo API key is configured */
export function isApolloConfigured(): boolean {
  return !!process.env.APOLLO_API_KEY
}
