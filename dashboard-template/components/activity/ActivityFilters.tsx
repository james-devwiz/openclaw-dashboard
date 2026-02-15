"use client" // Requires onClick handlers for filter state

import { cn } from "@/lib/utils"

import type { ActivityEntityType } from "@/types/activity.types"

interface ActivityFiltersProps {
  selected: ActivityEntityType | undefined
  onSelect: (type: ActivityEntityType | undefined) => void
}

const FILTERS: { value: ActivityEntityType | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "task", label: "Tasks" },
  { value: "goal", label: "Goals" },
  { value: "content", label: "Content" },
  { value: "approval", label: "Approvals" },
  { value: "brief", label: "Briefs" },
  { value: "heartbeat", label: "Heartbeats" },
  { value: "chat", label: "Chat" },
]

export function ActivityFilters({ selected, onSelect }: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by entity type">
      {FILTERS.map((f) => {
        const isActive = f.value === selected
        return (
          <button
            key={f.label}
            onClick={() => onSelect(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                : "bg-accent text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={isActive}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
