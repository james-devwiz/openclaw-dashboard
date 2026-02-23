"use client" // Requires useState for expanded entry, interactive draft selection

import { useState } from "react"
import { Clock, Check, ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/linkedin-constants"

import type { DraftHistoryEntry } from "@/types"

interface DraftHistoryListProps {
  history: DraftHistoryEntry[]
  onUseDraft: (text: string, entryId: string, variantIndex: number) => void
}

export default function DraftHistoryList({ history, onUseDraft }: DraftHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (history.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase">History</p>
      {history.map((entry) => {
        const isExpanded = expandedId === entry.id
        return (
          <div key={entry.id} className="rounded-lg border border-border bg-background overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-accent transition-colors"
              aria-label={`Draft from ${formatRelativeTime(entry.createdAt)}`}
            >
              {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <Clock size={10} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground truncate flex-1">
                {formatRelativeTime(entry.createdAt)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {entry.variants.length}v
              </span>
              {entry.usedVariantIndex !== null && (
                <Check size={10} className="text-green-600 shrink-0" aria-hidden="true" />
              )}
            </button>
            {isExpanded && (
              <div className="px-2 pb-2 space-y-1.5">
                {entry.instruction && (
                  <p className="text-[10px] text-muted-foreground italic">
                    &ldquo;{entry.instruction}&rdquo;
                  </p>
                )}
                {entry.variants.map((variant, i) => (
                  <button
                    key={i}
                    onClick={() => onUseDraft(variant, entry.id, i)}
                    className={cn(
                      "w-full text-left p-2 text-[11px] rounded border transition-colors group relative",
                      entry.usedVariantIndex === i
                        ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    {variant.slice(0, 150)}{variant.length > 150 ? "..." : ""}
                    <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={8} className="text-green-600" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
