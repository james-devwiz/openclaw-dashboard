"use client" // Requires onClick handlers and controlled input for date navigation

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BriefDateNavProps {
  date: string
  onChange: (date: string) => void
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + "T12:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDisplayDate(date: string): string {
  const d = new Date(date + "T12:00:00")
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  })
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" })
}

export function BriefDateNav({ date, onChange }: BriefDateNavProps) {
  const isToday = date === todayStr()

  return (
    <div className="flex items-center gap-3 mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(shiftDate(date, -1))}
        aria-label="Previous day"
      >
        <ChevronLeft size={16} />
      </Button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{formatDisplayDate(date)}</span>
        {!isToday && (
          <button
            onClick={() => onChange(todayStr())}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Today
          </button>
        )}
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm rounded-lg border border-border bg-card px-2 py-1.5 text-foreground"
        aria-label="Select date"
      />

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(shiftDate(date, 1))}
        aria-label="Next day"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
