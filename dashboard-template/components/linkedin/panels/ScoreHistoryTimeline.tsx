"use client" // Requires useState for expanded entry

import { useState } from "react"
import { Clock, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { getWampBand, formatRelativeTime } from "@/lib/linkedin-constants"

import type { ScoreHistoryEntry } from "@/types"

interface ScoreHistoryTimelineProps {
  history: ScoreHistoryEntry[]
}

export default function ScoreHistoryTimeline({ history }: ScoreHistoryTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (history.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase">Score History</p>
      {history.map((entry, idx) => {
        const prev = history[idx + 1]
        const delta = prev ? entry.total - prev.total : 0
        const band = getWampBand(entry.total)
        const isExpanded = expandedId === entry.id
        const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus

        return (
          <div key={entry.id} className="rounded-lg border border-border bg-background overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-accent transition-colors"
              aria-label={`Score ${entry.total} from ${formatRelativeTime(entry.createdAt)}`}
            >
              {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <span className={cn("text-xs font-bold w-7 text-center rounded", band.color)}>
                {entry.total}
              </span>
              <Clock size={10} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground truncate flex-1">
                {formatRelativeTime(entry.createdAt)}
              </span>
              {delta !== 0 && (
                <span className={cn("flex items-center gap-0.5 text-[10px] font-medium",
                  delta > 0 ? "text-green-600" : "text-red-500"
                )}>
                  <DeltaIcon size={10} aria-hidden="true" />
                  {delta > 0 ? "+" : ""}{delta}
                </span>
              )}
            </button>
            {isExpanded && entry.scoreData && (
              <div className="px-2 pb-2 space-y-1">
                <LayerRow label="Profile Fit" value={entry.scoreData.layer1?.subtotal} max={30} />
                <LayerRow label="Post & Content" value={entry.scoreData.layer2?.subtotal} max={30} />
                <LayerRow label="DM Conversation" value={entry.scoreData.layer3?.subtotal} max={40} />
                {entry.scoreData.summary && (
                  <p className="text-[10px] text-muted-foreground mt-1">{entry.scoreData.summary}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LayerRow({ label, value, max }: { label: string; value?: number; max: number }) {
  if (value === undefined) return null
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-medium text-foreground">{value}/{max}</span>
    </div>
  )
}
