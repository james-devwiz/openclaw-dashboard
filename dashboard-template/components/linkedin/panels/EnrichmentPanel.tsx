"use client" // Requires interactive back button

import { ArrowLeft, ExternalLink, Building2, Mail, Phone, MapPin, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Section, Detail, parseJson } from "./PanelHelpers"

interface EnrichmentPanelProps {
  enrichmentData?: string
  onBack: () => void
}

interface Person {
  name?: string; title?: string; email?: string; email_status?: string
  phone_numbers?: Array<{ raw_number: string }>; city?: string; state?: string; country?: string
  linkedin_url?: string; twitter_url?: string
}

interface Org {
  name?: string; website_url?: string; industry?: string
  estimated_num_employees?: number; annual_revenue?: number | null
  city?: string; country?: string; technologies?: string[]
}

export default function EnrichmentPanel({ enrichmentData, onBack }: EnrichmentPanelProps) {
  const data = parseJson<{ person?: Person; organization?: Org }>(enrichmentData)
  const person = data?.person
  const org = data?.organization

  return (
    <div className="w-72 border-l border-border overflow-y-auto p-4 space-y-4 shrink-0">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft size={12} /> Back
      </Button>

      {!data ? (
        <p className="text-xs text-muted-foreground">No enrichment data available. Click Enrich to fetch from Apollo.</p>
      ) : (
        <>
          {person && (
            <Section title="Contact">
              {person.name && <Detail label="Name" value={person.name} />}
              {person.title && <Detail label="Title" value={person.title} />}
              {person.email && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Mail size={10} aria-hidden="true" /> {person.email}
                  {person.email_status && (
                    <span className="text-[10px] opacity-70">({person.email_status})</span>
                  )}
                </div>
              )}
              {person.phone_numbers?.[0] && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Phone size={10} aria-hidden="true" /> {person.phone_numbers[0].raw_number}
                </div>
              )}
              {person.city && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <MapPin size={10} aria-hidden="true" /> {[person.city, person.state, person.country].filter(Boolean).join(", ")}
                </div>
              )}
              {person.linkedin_url && (
                <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink size={10} /> LinkedIn
                </a>
              )}
            </Section>
          )}

          {org && (
            <Section title="Organisation">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Building2 size={12} aria-hidden="true" /> {org.name}
              </div>
              {org.industry && <Detail label="Industry" value={org.industry} />}
              {org.estimated_num_employees && (
                <Detail label="Employees" value={org.estimated_num_employees.toLocaleString()} />
              )}
              {org.annual_revenue && (
                <Detail label="Revenue" value={`$${(org.annual_revenue / 1e6).toFixed(1)}M`} />
              )}
              {org.website_url && (
                <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                  <Globe size={10} /> Website
                </a>
              )}
              {org.technologies && org.technologies.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Technologies</p>
                  <div className="flex flex-wrap gap-1">
                    {org.technologies.slice(0, 10).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  )
}
