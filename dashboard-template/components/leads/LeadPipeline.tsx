"use client" // Requires drag-and-drop event handlers for pipeline status changes

import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { PIPELINE_STATUSES, STATUS_COLORS, STAGE_INFO, STAGE_EMOJI } from "@/lib/lead-constants"
import LeadCard from "./LeadCard"

import type { Lead, LeadStatus } from "@/types"

interface LeadPipelineProps {
  leads: Lead[]
  onMoveLead: (id: string, status: LeadStatus) => void
  onSelectLead: (lead: Lead) => void
}

export default function LeadPipeline({ leads, onMoveLead, onSelectLead }: LeadPipelineProps) {
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId)
  }

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("leadId")
    if (leadId) onMoveLead(leadId, status)
  }

  const lastIdx = PIPELINE_STATUSES.length - 1

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STATUSES.map((status, idx) => {
        const col = leads.filter((l) => l.status === status)
        const tooltipPos = idx === 0 ? "left-0" : idx === lastIdx ? "right-0" : "left-1/2 -translate-x-1/2"
        const emoji = STAGE_EMOJI[status] || ""
        return (
          <div
            key={status}
            className="min-w-[210px] flex-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{status}</span>
              {emoji && <span className="text-[10px] shrink-0" title={STAGE_INFO[status]}>{emoji}</span>}
              <span className="text-[10px] text-muted-foreground">({col.length})</span>
              {STAGE_INFO[status] && (
                <span className="relative group cursor-default">
                  <Info size={12} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" aria-hidden="true" />
                  <span className={cn("pointer-events-none absolute top-full mt-1.5 z-50 hidden group-hover:block w-52 rounded-lg bg-foreground text-background text-[11px] leading-tight px-3 py-2 shadow-lg", tooltipPos)}>
                    {STAGE_INFO[status]}
                  </span>
                </span>
              )}
            </div>
            <div className="space-y-2">
              {col.map((lead) => (
                <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)}>
                  <LeadCard lead={lead} onClick={() => onSelectLead(lead)} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
