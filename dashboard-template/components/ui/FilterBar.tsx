"use client" // Requires interactive onClick handlers for filter chip selection

import { cn } from "@/lib/utils"

interface FilterOption {
  id: string
  label: string
}

interface FilterBarProps {
  filters: FilterOption[]
  selected: string
  onChange: (id: string) => void
  className?: string
}

export default function FilterBar({ filters, selected, onChange, className }: FilterBarProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)} role="tablist" aria-label="Filters">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          role="tab"
          aria-selected={selected === f.id}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm transition-colors",
            selected === f.id
              ? "bg-claw-blue text-white font-medium"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
