"use client" // Requires onClick handlers for approve/dismiss actions

import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type { MemorySuggestion, SuggestionStatus } from "@/types/index"

interface MemorySuggestionCardProps {
  suggestion: MemorySuggestion
  onRespond: (id: string, status: SuggestionStatus, extra?: { title?: string; content?: string; targetFile?: string; targetCategory?: string }) => void
}

export default function MemorySuggestionCard({ suggestion, onRespond }: MemorySuggestionCardProps) {
  return (
    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-foreground truncate">{suggestion.title}</h4>
          {suggestion.reason && (
            <p className="text-xs text-muted-foreground mt-0.5">{suggestion.reason}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestion.content.slice(0, 150)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] capitalize border-0 bg-muted">{suggestion.targetCategory}</Badge>
            {suggestion.sourceType !== "manual" && (
              <Badge variant="outline" className="text-[10px] border-0 bg-blue-500/10 text-blue-600">{suggestion.sourceType}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRespond(suggestion.id, "approved", { title: suggestion.title, content: suggestion.content, targetFile: suggestion.targetFile, targetCategory: suggestion.targetCategory })}
            className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
            aria-label="Approve suggestion"
            title="Approve"
          >
            <Check size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRespond(suggestion.id, "dismissed")}
            className="h-7 w-7 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
            aria-label="Dismiss suggestion"
            title="Dismiss"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
