"use client" // Requires useState for row expansion and onClick handlers for sorting

import { useState } from "react"
import { ChevronDown, ChevronUp, Trash2, BookmarkPlus, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn, formatTime, formatDate } from "@/lib/utils"
import { TYPE_COLORS, TYPE_SHORT_LABELS } from "@/lib/brief-constants"
import MarkdownMessage from "@/components/chat/MarkdownMessage"

import type { Brief } from "@/types"

interface BriefTableProps {
  briefs: Brief[]
  sortBy: "createdAt" | "date"
  sortDir: "ASC" | "DESC"
  onToggleSort: (col: "createdAt" | "date") => void
  onDelete: (id: string) => void
  loading: boolean
}

export function BriefTable({ briefs, sortBy, sortDir, onToggleSort, onDelete, loading }: BriefTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  if (briefs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <FileText size={32} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No briefs match your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-28">Type</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Title</th>
            <SortHeader label="Date" col="date" sortBy={sortBy} sortDir={sortDir} onToggle={onToggleSort} />
            <SortHeader label="Time" col="createdAt" sortBy={sortBy} sortDir={sortDir} onToggle={onToggleSort} />
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-20">Source</th>
          </tr>
        </thead>
        <tbody>
          {briefs.map((brief) => (
            <BriefTableRow
              key={brief.id}
              brief={brief}
              expanded={expandedId === brief.id}
              onToggle={() => setExpandedId(expandedId === brief.id ? null : brief.id)}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SortHeader({ label, col, sortBy, sortDir, onToggle }: {
  label: string; col: "createdAt" | "date"
  sortBy: string; sortDir: string; onToggle: (col: "createdAt" | "date") => void
}) {
  const active = sortBy === col
  const Icon = active && sortDir === "ASC" ? ChevronUp : ChevronDown
  return (
    <th className="text-left px-4 py-2.5 w-24">
      <button
        onClick={() => onToggle(col)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Icon size={12} className={cn(active ? "text-foreground" : "text-muted-foreground/50")} />
      </button>
    </th>
  )
}

function BriefTableRow({ brief, expanded, onToggle, onDelete }: {
  brief: Brief; expanded: boolean; onToggle: () => void; onDelete: (id: string) => void
}) {
  const colors = TYPE_COLORS[brief.briefType] || TYPE_COLORS["Custom"]

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border last:border-0 cursor-pointer hover:bg-accent/20 transition-colors"
        role="button"
        aria-expanded={expanded}
      >
        <td className="px-4 py-2.5">
          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", colors.bg, colors.text)}>
            {TYPE_SHORT_LABELS[brief.briefType] || brief.briefType}
          </span>
        </td>
        <td className="px-4 py-2.5 text-foreground truncate max-w-[300px]">{brief.title}</td>
        <td className="px-4 py-2.5 text-muted-foreground">{formatDate(brief.date + "T12:00:00")}</td>
        <td className="px-4 py-2.5 text-muted-foreground">{formatTime(brief.createdAt)}</td>
        <td className="px-4 py-2.5 text-muted-foreground capitalize">{brief.source}</td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5}>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 bg-accent/10 border-b border-border">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    {brief.content ? <MarkdownMessage content={brief.content} /> : "No content."}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDelete(brief.id) }}
                      className="text-red-500 hover:text-red-600"
                      aria-label={`Delete ${brief.title}`}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}
