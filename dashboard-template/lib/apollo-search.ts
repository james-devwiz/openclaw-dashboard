// Apollo.io search operations — org search and people search

import type { ApolloOrg, ApolloPerson } from "./apollo"

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

/** Search organizations matching ICP criteria via people/company search */
export async function searchOrganizations(opts: {
  keywords: string[]
  industries?: string[]
  minEmployees?: number
  minRevenue?: number
  countries?: string[]
  limit?: number
}): Promise<ApolloOrg[]> {
  const body: Record<string, unknown> = {
    per_page: Math.min(opts.limit || 10, 25),
    page: 1,
  }

  if (opts.minRevenue) {
    body.revenue_range = { min: opts.minRevenue }
  }
  if (opts.minEmployees) {
    body.organization_num_employees_ranges = [`${opts.minEmployees},`]
  }
  if (opts.countries?.length) {
    body.organization_locations = opts.countries
  }
  if (opts.keywords?.length) {
    body.q_organization_keyword_tags = opts.keywords
  }

  const data = await apolloFetch("/mixed_companies/search", body) as { organizations?: ApolloOrg[] }

  return (data.organizations || []).map((org) => ({
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
  }))
}

/** Search for decision makers at a specific company domain */
export async function searchPeople(opts: {
  domain?: string
  companyName?: string
  titles?: string[]
  limit?: number
}): Promise<ApolloPerson[]> {
  const personFields: Record<string, unknown> = {
    seniority: ["c_suite", "founder", "owner", "vp", "director"],
  }
  if (opts.titles?.length) personFields.job_title = opts.titles.join(" OR ")

  const companyFields: Record<string, unknown> = {}
  if (opts.domain) companyFields.domain = opts.domain
  if (opts.companyName && !opts.domain) companyFields.seo_title = opts.companyName

  const body = {
    filter_params: {
      person_fields: personFields,
      company_fields: companyFields,
      search_params: {
        type: "person",
        page: 1,
        page_size: Math.min(opts.limit || 5, 10),
      },
    },
  }

  type ApiSearchResult = { items?: Array<{ person?: ApolloPerson }>; people?: ApolloPerson[] }
  const data = await apolloFetch("/mixed_people/api_search", body) as ApiSearchResult

  const people = data.items
    ? data.items.map((item) => item.person).filter(Boolean) as ApolloPerson[]
    : data.people || []

  return people.map((p) => ({
    id: p.id || "",
    first_name: p.first_name || "",
    last_name: p.last_name || "",
    name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
    title: p.title || "",
    email: p.email || "",
    email_status: p.email_status || "unknown",
    linkedin_url: p.linkedin_url || "",
    phone_numbers: p.phone_numbers || [],
    organization: p.organization || null,
    city: p.city || "",
    state: p.state || "",
    country: p.country || "",
  }))
}
