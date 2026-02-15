"use client" // Requires useState for expand/collapse and useMemorySuggestions hook

import { useState } from "react"
import { Lightbulb, ChevronDown } from "lucide-react"

import MemorySuggestionCard from "./MemorySuggestionCard"
import { useMemorySuggestions } from "@/hooks/useMemorySuggestions"
import { cn } from "@/lib/utils"

interface MemorySuggestionBannerProps {
  onSuggestionApplied?: () => void
}

export default function MemorySuggestionBanner({ onSuggestionApplied }: MemorySuggestionBannerProps) {
  const { suggestions, respond } = useMemorySuggestions()
  const [expanded, setExpanded] = useState(false)

  if (suggestions.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <Lightbulb size={16} className="text-amber-600 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground flex-1">
          {suggestions.length} memory suggestion{suggestions.length !== 1 ? "s" : ""} pending review
        </span>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {suggestions.map((s) => (
            <MemorySuggestionCard
              key={s.id}
              suggestion={s}
              onRespond={async (...args) => {
                await respond(...args)
                onSuggestionApplied?.()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
