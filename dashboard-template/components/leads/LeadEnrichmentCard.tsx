import { Building2, Users, Globe, ExternalLink, Mail, Phone, CheckCircle2, XCircle } from "lucide-react"

import type { Lead } from "@/types"

interface LeadEnrichmentCardProps {
  lead: Lead
}

interface OrgData {
  industry?: string; estimated_num_employees?: number; annual_revenue_printed?: string
  city?: string; state?: string; country?: string; linkedin_url?: string
}

interface PersonData {
  name?: string; title?: string; email?: string; emailVerified?: boolean
  phone?: string; linkedinUrl?: string
}

interface EnrichmentData {
  organization?: OrgData; people?: PersonData[]; websitePreview?: string
}

export default function LeadEnrichmentCard({ lead }: LeadEnrichmentCardProps) {
  const enrichment = parseJson<EnrichmentData>(lead.enrichmentData)
  const company = parseJson<OrgData>(lead.companyData)

  if (!enrichment && !company) {
    return (
      <div className="bg-accent/30 rounded-lg p-4">
        <p className="text-xs text-muted-foreground text-center">Not yet enriched — click Enrich to populate.</p>
      </div>
    )
  }

  const org: OrgData = enrichment?.organization || company || {}
  const people: PersonData[] = enrichment?.people || []

  return (
    <div className="space-y-3">
      {Object.keys(org).length > 0 && (
        <div className="bg-accent/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={14} className="text-muted-foreground" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Company</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {org.industry && <Field label="Industry" value={org.industry} />}
            {org.estimated_num_employees && <Field label="Employees" value={String(org.estimated_num_employees)} />}
            {org.annual_revenue_printed && <Field label="Revenue" value={org.annual_revenue_printed} />}
            {(org.city || org.country) && (
              <Field label="Location" value={[org.city, org.state, org.country].filter(Boolean).join(", ")} />
            )}
          </div>
          {org.linkedin_url && (
            <a href={org.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
              LinkedIn <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      {people.length > 0 && (
        <div className="bg-accent/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-muted-foreground" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Decision Makers</h4>
          </div>
          <div className="space-y-3">
            {people.slice(0, 3).map((person, i) => (
              <div key={i} className="border-t border-border/50 pt-2 first:border-0 first:pt-0">
                <p className="text-sm font-medium text-foreground">{person.name || "Unknown"}</p>
                {person.title && <p className="text-xs text-muted-foreground">{person.title}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  {person.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-foreground">
                      <Mail size={10} className="text-muted-foreground" aria-hidden="true" />
                      {person.email}
                      {person.emailVerified !== undefined && (
                        person.emailVerified
                          ? <CheckCircle2 size={10} className="text-green-500" aria-label="Verified" />
                          : <XCircle size={10} className="text-red-400" aria-label="Unverified" />
                      )}
                    </span>
                  )}
                  {person.phone && (
                    <span className="inline-flex items-center gap-1 text-xs text-foreground">
                      <Phone size={10} className="text-muted-foreground" aria-hidden="true" /> {person.phone}
                    </span>
                  )}
                </div>
                {person.linkedinUrl && (
                  <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline">
                    LinkedIn <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {enrichment?.websitePreview && (
        <div className="bg-accent/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} className="text-muted-foreground" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Website Preview</h4>
          </div>
          <p className="text-xs text-muted-foreground">{String(enrichment.websitePreview).slice(0, 200)}</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <p className="text-xs text-foreground">{value}</p>
    </div>
  )
}

function parseJson<T>(raw: string | undefined | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}
