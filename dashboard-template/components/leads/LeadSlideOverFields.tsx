"use client" // Requires useState, useCallback for debounced field editing

import { useState, useCallback, useEffect } from "react"
import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import LeadScoreBadge from "./LeadScoreBadge"
import { LEAD_STATUSES, BUSINESSES, SOURCES } from "@/lib/lead-constants"

import type { Lead, LeadStatus, LeadBusiness, LeadPriority } from "@/types"

interface LeadSlideOverFieldsProps {
  lead: Lead
  onUpdate: (updates: Partial<Lead>) => void
}

export default function LeadSlideOverFields({ lead, onUpdate }: LeadSlideOverFieldsProps) {
  const [notes, setNotes] = useState(lead.notes)
  const [nextAction, setNextAction] = useState(lead.nextAction)

  useEffect(() => { setNotes(lead.notes); setNextAction(lead.nextAction) }, [lead.notes, lead.nextAction])

  const debounceUpdate = useCallback((field: string, value: string) => {
    const timer = setTimeout(() => onUpdate({ [field]: value }), 500)
    return () => clearTimeout(timer)
  }, [onUpdate])

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 items-center py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="col-span-2">{children}</div>
    </div>
  )

  return (
    <div className="space-y-1">
      <Field label="Score"><LeadScoreBadge score={lead.score} /></Field>

      <Field label="Status">
        <select value={lead.status} onChange={(e) => onUpdate({ status: e.target.value as LeadStatus })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Lead status">
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <Field label="Business">
        <select value={lead.business} onChange={(e) => onUpdate({ business: e.target.value as LeadBusiness })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Business">
          {BUSINESSES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>

      <Field label="Priority">
        <select value={lead.priority} onChange={(e) => onUpdate({ priority: e.target.value as LeadPriority })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Priority">
          {["High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      <Field label="Contact">
        <input value={lead.contactName} onChange={(e) => onUpdate({ contactName: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Contact name" />
      </Field>

      <Field label="Title">
        <input value={lead.contactTitle} onChange={(e) => onUpdate({ contactTitle: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Job title" />
      </Field>

      <Field label="Email">
        <div className="flex items-center gap-1.5">
          <input value={lead.email} onChange={(e) => onUpdate({ email: e.target.value })}
            className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Email" type="email" />
          {lead.emailVerified && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              lead.emailVerified === "valid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              lead.emailVerified === "invalid" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {lead.emailVerified}
            </span>
          )}
        </div>
      </Field>

      <Field label="Phone">
        <input value={lead.phone} onChange={(e) => onUpdate({ phone: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Phone" />
      </Field>

      <Field label="Website">
        <div className="flex items-center gap-1">
          <input value={lead.website} onChange={(e) => onUpdate({ website: e.target.value })}
            className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="https://" />
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600" aria-label="Open website">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </Field>

      <Field label="LinkedIn">
        <input value={lead.linkedinUrl} onChange={(e) => onUpdate({ linkedinUrl: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="LinkedIn URL" />
      </Field>

      <Field label="Location">
        <input value={lead.location} onChange={(e) => onUpdate({ location: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="City, Country" />
      </Field>

      <Field label="Industry">
        <input value={lead.industry} onChange={(e) => onUpdate({ industry: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Industry" />
      </Field>

      <Field label="Revenue">
        <div>
          <input value={lead.estimatedRevenue} onChange={(e) => onUpdate({ estimatedRevenue: e.target.value })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="e.g. $1M+" />
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{getRevenueSource(lead)}</p>
        </div>
      </Field>

      <Field label="Source">
        <span className="text-xs text-muted-foreground">{lead.source}</span>
      </Field>

      {lead.signalType && (
        <Field label="Signal">
          <span className="text-xs text-muted-foreground">{lead.signalType}: {lead.signalDetail}</span>
        </Field>
      )}

      <Field label="Next Action">
        <input value={nextAction} onChange={(e) => { setNextAction(e.target.value); debounceUpdate("nextAction", e.target.value) }}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Next action..." />
      </Field>

      <Field label="Action Date">
        <input type="date" value={lead.nextActionDate || ""} onChange={(e) => onUpdate({ nextActionDate: e.target.value })}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
      </Field>

      <div className="pt-2">
        <label className="text-xs text-muted-foreground block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => { setNotes(e.target.value); debounceUpdate("notes", e.target.value) }}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" rows={3} placeholder="Notes..." />
      </div>
    </div>
  )
}

function getRevenueSource(lead: Lead): string {
  if (lead.enrichmentData) return "Source: Apollo enrichment estimate"
  if (lead.source === "Apollo") return "Source: Apollo org search"
  if (lead.source === "Import") return "Source: imported data"
  if (lead.source === "Bright Data") return "Source: Bright Data discovery"
  return "Source: manual entry"
}
