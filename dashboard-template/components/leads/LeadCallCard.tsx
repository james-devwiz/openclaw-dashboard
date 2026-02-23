import { Phone, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

import LeadScoreBadge from "./LeadScoreBadge"

import type { Lead } from "@/types"

interface LeadCallCardProps {
  lead: Lead
  onLogCall: () => void
  onSkip: () => void
  onArchive: () => void
}

export default function LeadCallCard({ lead, onLogCall, onSkip, onArchive }: LeadCallCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{lead.companyName}</h3>
          {lead.contactName && (
            <p className="text-sm text-muted-foreground">{lead.contactName} — {lead.contactTitle}</p>
          )}
        </div>
        <LeadScoreBadge score={lead.score} />
      </div>

      {/* Click-to-call */}
      {lead.phone && (
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center gap-2 px-4 py-2.5 mb-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
          aria-label={`Call ${lead.phone}`}
        >
          <Phone size={16} /> {lead.phone}
        </a>
      )}

      {/* Context */}
      <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
        {lead.signalDetail && <p><span className="font-medium">Signal:</span> {lead.signalDetail}</p>}
        {lead.industry && <p><span className="font-medium">Industry:</span> {lead.industry}</p>}
        {lead.location && <p><span className="font-medium">Location:</span> {lead.location}</p>}
        {lead.notes && <p><span className="font-medium">Notes:</span> {lead.notes}</p>}
      </div>

      {/* Links */}
      <div className="flex items-center gap-2 mb-4">
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <ExternalLink size={10} /> Website
          </a>
        )}
        {lead.linkedinUrl && (
          <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <ExternalLink size={10} /> LinkedIn
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onLogCall} size="sm">
          Log Call
        </Button>
        <Button onClick={onSkip} variant="outline" size="sm">
          Skip
        </Button>
        <Button onClick={onArchive} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
          Archive
        </Button>
      </div>
    </div>
  )
}
