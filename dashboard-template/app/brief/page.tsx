"use client" // Requires useState for view toggle and useBriefs hook for calendar view state

import { useState } from "react"
import { RefreshCw, Calendar, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import PageHeader from "@/components/layout/PageHeader"
import { BriefCalendarView } from "@/components/briefs/BriefCalendarView"
import { BriefTableView } from "@/components/briefs/BriefTableView"
import { useBriefs } from "@/hooks/useBriefs"

type ViewMode = "calendar" | "table"

export default function BriefPage() {
  const [view, setView] = useState<ViewMode>("calendar")
  const calendarState = useBriefs()

  return (
    <div>
      <PageHeader
        title="Briefs & Reports"
        subtitle="Morning briefs, meeting notes, and daily reports"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setView("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "calendar" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Calendar view"
              >
                <Calendar size={14} aria-hidden="true" /> Calendar
              </button>
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "table" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Table view"
              >
                <Table2 size={14} aria-hidden="true" /> Table
              </button>
            </div>
            {view === "calendar" && (
              <button
                onClick={calendarState.refetch}
                className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh briefs"
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        }
      />

      {view === "calendar" ? (
        <BriefCalendarView
          briefs={calendarState.briefs}
          date={calendarState.date}
          setDate={calendarState.setDate}
          loading={calendarState.loading}
          removeBrief={calendarState.removeBrief}
        />
      ) : (
        <BriefTableView />
      )}
    </div>
  )
}
