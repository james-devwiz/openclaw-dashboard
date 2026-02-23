import { Building2, ExternalLink } from "lucide-react"

import { Section, Detail } from "./PanelHelpers"

interface CompanySectionProps {
  org: {
    name?: string; website_url?: string; industry?: string
    estimated_num_employees?: number; annual_revenue?: number | null
  }
}

export default function CompanySection({ org }: CompanySectionProps) {
  return (
    <Section title="Company">
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Building2 size={12} aria-hidden="true" /> {org.name}
      </div>
      {org.industry && <Detail label="Industry" value={org.industry} />}
      {org.estimated_num_employees && (
        <Detail label="Employees" value={org.estimated_num_employees.toLocaleString()} />
      )}
      {org.annual_revenue && (
        <Detail label="Revenue" value={`$${(org.annual_revenue / 1000000).toFixed(1)}M`} />
      )}
      {org.website_url && (
        <a href={org.website_url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
          <ExternalLink size={10} aria-hidden="true" /> Website
        </a>
      )}
    </Section>
  )
}
