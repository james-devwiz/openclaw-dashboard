"use client" // Requires onClick handlers for tab selection

import { cn } from "@/lib/utils"
import { ALL_IDEA_CATEGORIES, IDEA_CATEGORY_COLORS } from "@/lib/content-constants"

interface IdeaCategoryTabsProps {
  categoryCounts: Record<string, number>
  activeCategory: string
  onCategoryChange: (cat: string) => void
}

export default function IdeaCategoryTabs({ categoryCounts, activeCategory, onCategoryChange }: IdeaCategoryTabsProps) {
  const totalCount = Object.values(categoryCounts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Filter by idea category">
      <TabButton label="All" count={totalCount} active={activeCategory === ""} onClick={() => onCategoryChange("")} />
      {ALL_IDEA_CATEGORIES.map((cat) => {
        const count = categoryCounts[cat] || 0
        if (count === 0) return null
        const colors = IDEA_CATEGORY_COLORS[cat]
        return (
          <TabButton
            key={cat}
            label={cat}
            count={count}
            active={activeCategory === cat}
            onClick={() => onCategoryChange(cat)}
            colorClass={`${colors.bg} ${colors.text}`}
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
