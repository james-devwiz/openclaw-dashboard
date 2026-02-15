"use client" // Wraps calendar-specific UI (date nav, brief list, loading/empty states)

import { FileText } from "lucide-react"

import { BriefDateNav } from "@/components/briefs/BriefDateNav"
import { BriefListItem } from "@/components/briefs/BriefListItem"

import type { Brief } from "@/types"

interface BriefCalendarViewProps {
  briefs: Brief[]
  date: string
  setDate: (date: string) => void
  loading: boolean
  removeBrief: (id: string) => void
}

export function BriefCalendarView({ briefs, date, setDate, loading, removeBrief }: BriefCalendarViewProps) {
  return (
    <div>
      <BriefDateNav date={date} onChange={setDate} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <FileText size={32} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">No briefs or reports for this date</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {briefs.map((brief) => (
            <BriefListItem key={brief.id} brief={brief} onDelete={removeBrief} />
          ))}
        </div>
      )}
    </div>
  )
}
