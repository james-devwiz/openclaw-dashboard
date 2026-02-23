"use client" // Requires useState for expand/collapse state

import { useState } from "react"
import { ChevronDown, Trash2, BookmarkPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn, formatTime } from "@/lib/utils"
import { TYPE_COLORS } from "@/lib/brief-constants"
import MarkdownMessage from "@/components/chat/MarkdownMessage"

import type { Brief } from "@/types"

interface BriefListItemProps {
  brief: Brief
  onDelete?: (id: string) => void
  onSaveToMemory?: (content: string) => void
}

function getDateMismatchLabel(brief: Brief): string | null {
  if (!brief.createdAt) return null
  const createdAest = new Date(brief.createdAt).toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" })
  if (createdAest === brief.date) return null
  const d = new Date(createdAest + "T12:00:00")
  return `generated ${d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Brisbane" })}`
}

export function BriefListItem({ brief, onDelete, onSaveToMemory }: BriefListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = TYPE_COLORS[brief.briefType] || TYPE_COLORS["Morning Brief"]
  const mismatchLabel = getDateMismatchLabel(brief)

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
        aria-label={`${brief.title} — expand details`}
      >
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", colors.bg, colors.text)}>
          {brief.briefType}
        </span>
        <span className="text-sm font-medium text-foreground truncate flex-1">{brief.title}</span>
        {mismatchLabel && (
          <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">({mismatchLabel})</span>
        )}
        <span className="text-xs text-muted-foreground shrink-0">{formatTime(brief.createdAt)}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform shrink-0", expanded && "rotate-180")} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground">
                {brief.content ? <MarkdownMessage content={brief.content} /> : "No content."}
              </div>
              <div className="flex items-center gap-3 mt-3">
                {onSaveToMemory && brief.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onSaveToMemory(brief.content) }}
                    className="text-blue-600 hover:text-blue-700"
                    aria-label={`Save ${brief.title} to memory`}
                  >
                    <BookmarkPlus size={12} /> Save to Memory
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDelete(brief.id) }}
                    className="text-red-500 hover:text-red-600"
                    aria-label={`Delete ${brief.title}`}
                  >
                    <Trash2 size={12} /> Delete
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
