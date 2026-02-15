"use client" // Requires onClick handlers for tab selection

import { cn } from "@/lib/utils"
import { TYPE_SHORT_LABELS, TYPE_COLORS, TYPE_KIND } from "@/lib/brief-constants"

import type { BriefKind } from "@/types"

interface BriefTypeTabsProps {
  typeCounts: Record<string, number>
  activeType: string
  onTypeChange: (type: string) => void
  kind?: BriefKind | ""
}

const TAB_ORDER = [
  "Morning Brief", "Pre-Meeting Brief",
  "End of Day Report", "Post-Meeting Report", "Weekly Review",
  "Business Analysis", "Cost Report", "Error Report", "Self-Improvement Report", "Custom",
]

export function BriefTypeTabs({ typeCounts, activeType, onTypeChange, kind }: BriefTypeTabsProps) {
  const totalCount = Object.values(typeCounts).reduce((sum, n) => sum + n, 0)
  const filteredTabs = kind ? TAB_ORDER.filter((t) => TYPE_KIND[t] === kind) : TAB_ORDER

  return (
    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Filter by brief type">
      <TabButton label="All" count={totalCount} active={activeType === ""} onClick={() => onTypeChange("")} />
      {filteredTabs.map((type) => {
        const count = typeCounts[type] || 0
        if (count === 0) return null
        const colors = TYPE_COLORS[type]
        return (
          <TabButton
            key={type}
            label={TYPE_SHORT_LABELS[type] || type}
            count={count}
            active={activeType === type}
            onClick={() => onTypeChange(type)}
            colorClass={colors ? `${colors.bg} ${colors.text}` : undefined}
          />
        )
      })}
    </div>
  )
}

function TabButton({ label, count, active, onClick, colorClass }: {
  label: string; count: number; active: boolean; onClick: () => void; colorClass?: string
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      {label}
      <span className={cn(
        "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
        active ? "bg-background/20 text-background" : colorClass || "bg-accent text-muted-foreground"
      )}>
        {count}
      </span>
    </button>
  )
}
