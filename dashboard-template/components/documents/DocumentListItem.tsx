"use client" // Requires useState for expand/collapse state

import { useState } from "react"
import { ChevronDown, Trash2, Tag, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/document-constants"
import MarkdownMessage from "@/components/chat/MarkdownMessage"

import type { Document } from "@/types"

interface DocumentListItemProps {
  doc: Document
  onDelete?: (id: string) => void
  onOpen?: (doc: Document) => void
}

export function DocumentListItem({ doc, onDelete, onOpen }: DocumentListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS["Notes"]
  const tags = doc.tags ? doc.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  const plain = doc.content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*>]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim()
  const preview = plain.length > 120 ? plain.slice(0, 120) + "..." : plain

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
              <div className="text-sm text-foreground max-h-96 overflow-y-auto">
                {doc.content ? <MarkdownMessage content={doc.content} /> : <span className="text-muted-foreground">No content.</span>}
              </div>
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag size={12} className="text-muted-foreground" aria-hidden="true" />
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                {onOpen && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpen(doc) }}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    aria-label={`Open ${doc.title}`}
                  >
                    <ExternalLink size={12} /> Open
                  </button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
