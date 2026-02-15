"use client" // Requires useState for expand/collapse state

import { useState } from "react"
import { ChevronDown, Trash2, Tag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"

import type { Document } from "@/types"

interface DocumentListItemProps {
  doc: Document
  onDelete?: (id: string) => void
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Meeting Transcript": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Email Draft": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  "Notes": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "Reference": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "Template": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
}

export function DocumentListItem({ doc, onDelete }: DocumentListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS["Notes"]
  const tags = doc.tags ? doc.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  const preview = doc.content.length > 120 ? doc.content.slice(0, 120) + "..." : doc.content

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
        aria-label={`${doc.title} — expand details`}
      >
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", colors.bg, colors.text)}>
          {doc.category}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">{doc.title}</span>
          {!expanded && preview && (
            <span className="text-xs text-muted-foreground truncate block">{preview}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(doc.createdAt)}</span>
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
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              <div className="text-sm text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                {doc.content || "No content."}
              </div>
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag size={12} className="text-muted-foreground" aria-hidden="true" />
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                  aria-label={`Delete ${doc.title}`}
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
