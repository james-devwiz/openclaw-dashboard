import { Phone, Linkedin, Clock } from "lucide-react"
import { MANUAL_STAGES, ROTTING_HOURS } from "@/lib/lead-constants"

import LeadScoreBadge from "./LeadScoreBadge"

import type { Lead } from "@/types"

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const initials = lead.companyName.slice(0, 2).toUpperCase()
  const isRotting = MANUAL_STAGES.includes(lead.status)
    && (Date.now() - new Date(lead.updatedAt).getTime()) > ROTTING_HOURS * 3600000

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left rounded-lg border border-border bg-card p-3 hover:shadow-md transition-shadow"
      aria-label={`Open ${lead.companyName}`}
    >
      {isRotting && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" title="Stale — no activity for 48h+" />
      )}
      {/* Row 1: Logo + company name + score */}
      <div className="flex items-start gap-2 mb-1">
        {lead.logoUrl ? (
          <img src={lead.logoUrl} alt=""
            className="w-7 h-7 rounded-md object-contain bg-accent flex-shrink-0" aria-hidden="true" />
        ) : (
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-[10px] font-medium text-muted-foreground flex-shrink-0" aria-hidden="true">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">{lead.companyName}</p>
            <LeadScoreBadge score={lead.score} />
          </div>
          {/* Row 2: Contact name + title */}
          {lead.contactName && (
            <p className="text-xs text-muted-foreground truncate">
              {lead.contactName}{lead.contactTitle ? ` — ${lead.contactTitle}` : ""}
            </p>
          )}
        </div>
      </div>
      {/* Row 3: Tags + icons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
          {lead.business}
        </span>
        {lead.source && lead.source !== "Manual" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {lead.source}
          </span>
        )}
        {lead.phone && <Phone size={10} className="text-green-600" aria-hidden="true" />}
        {lead.linkedinConnected ? (
          <Linkedin size={10} className="text-green-600" aria-hidden="true" />
        ) : lead.status === "LinkedIn Request" ? (
          <Clock size={10} className="text-amber-500" aria-hidden="true" />
        ) : null}
      </div>
    </button>
  )
}
