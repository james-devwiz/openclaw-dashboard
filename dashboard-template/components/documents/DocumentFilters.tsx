"use client" // Requires onClick handlers for category filter state

import { cn } from "@/lib/utils"

import type { DocumentCategory } from "@/types"

interface DocumentFiltersProps {
  selected: string | undefined
  onSelect: (category: string | undefined) => void
}

const FILTERS: { value: DocumentCategory | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "Meeting Transcript", label: "Transcripts" },
  { value: "Email Draft", label: "Email Drafts" },
  { value: "Notes", label: "Notes" },
  { value: "Reference", label: "Reference" },
  { value: "Template", label: "Templates" },
  { value: "Research", label: "Research" },
]

export function DocumentFilters({ selected, onSelect }: DocumentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
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
