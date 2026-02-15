"use client" // Displays computed stats from search results

import { cn } from "@/lib/utils"
import { TYPE_SHORT_LABELS, TYPE_COLORS } from "@/lib/brief-constants"

interface BriefStatsProps {
  total: number
  typeCounts: Record<string, number>
}

export function BriefStats({ total, typeCounts }: BriefStatsProps) {
  const entries = Object.entries(typeCounts).filter(([, n]) => n > 0)

  return (
    <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
      <span className="font-medium">{total} brief{total !== 1 ? "s" : ""}</span>
      {entries.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-border">|</span>
          {entries.map(([type, count]) => {
            const colors = TYPE_COLORS[type]
            return (
              <span
                key={type}
                className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", colors?.bg, colors?.text)}
              >
                {TYPE_SHORT_LABELS[type] || type} {count}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
