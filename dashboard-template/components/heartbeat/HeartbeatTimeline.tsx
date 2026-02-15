"use client" // Requires useState for expand/collapse and useEffect for brief lookups

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckCircle2, XCircle, MinusCircle, ChevronDown,
  FileText, AlertTriangle, Activity, Clock, Copy, Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn, formatRelativeTime } from "@/lib/utils"

import type { HeartbeatEvent } from "@/types"

interface HeartbeatTimelineProps {
  events: HeartbeatEvent[]
  total: number
  onLoadMore: () => void
}

interface LinkedBrief {
  id: string
  briefType: string
  title: string
}

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, bg: "bg-emerald-100 dark:bg-emerald-900/30", fg: "text-emerald-600 dark:text-emerald-400", label: "Success" },
  failure: { icon: XCircle, bg: "bg-red-100 dark:bg-red-900/30", fg: "text-red-600 dark:text-red-400", label: "Failure" },
  skipped: { icon: MinusCircle, bg: "bg-gray-100 dark:bg-gray-800/50", fg: "text-gray-500 dark:text-gray-400", label: "Skipped" },
}

function parseHeartbeatSummary(summary: string): string[] {
  const cleaned = summary
    .replace(/^(HEARTBEAT_OK|Health check:|Manual heartbeat:|Heartbeat failure:)\s*/i, "")
    .trim()

  if (!cleaned || cleaned === "HEARTBEAT_OK") return ["All checks passed"]

  // Split on semicolons or uppercase-letter commas, but not inside parentheses
  const items: string[] = []
  let current = ""
  let depth = 0
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === "(") depth++
    else if (ch === ")") depth--

    if (depth === 0 && ch === ";") {
      if (current.trim()) items.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  if (current.trim()) items.push(current.trim())
  return items.length > 0 ? items : [cleaned]
}

function buildCopyText(event: HeartbeatEvent, items: string[], briefs: LinkedBrief[]): string {
  const lines: string[] = []
  lines.push(`Heartbeat: ${event.summary}`)
  lines.push(`Status: ${event.status} | Triggered by: ${event.triggeredBy} | ${new Date(event.createdAt).toLocaleString()}`)
  lines.push("")
  for (const item of items) lines.push(`- ${item}`)
  if (event.detail) { lines.push(""); lines.push(event.detail) }
  if (briefs.length > 0) {
    lines.push(""); lines.push("Linked Briefs:")
    for (const b of briefs) lines.push(`- ${b.title} (${b.briefType})`)
  }
  return lines.join("\n")
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-border/50 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy heartbeat details"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

function HeartbeatEventItem({ event, linkedBriefs }: { event: HeartbeatEvent; linkedBriefs: LinkedBrief[] }) {
  const [expanded, setExpanded] = useState(false)
  const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.success
  const Icon = config.icon
  const durationStr = event.duration > 0 ? `${(event.duration / 1000).toFixed(1)}s` : ""
  const summaryItems = parseHeartbeatSummary(event.summary)
  const hasContent = summaryItems.length > 0 || event.detail || linkedBriefs.length > 0

  return (
    <div className="relative flex gap-4 pl-1">
      <div className={cn("relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", config.bg)}>
        <Icon className={cn("size-3.5", config.fg)} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div
          className={cn("flex items-start gap-2", hasContent && "cursor-pointer select-none")}
          onClick={() => hasContent && setExpanded(!expanded)}
          role={hasContent ? "button" : undefined}
          aria-expanded={hasContent ? expanded : undefined}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{event.summary}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={cn("text-xs px-1.5 py-0.5 rounded", config.bg, config.fg)}>
                {config.label}
              </span>
              {event.triggeredBy && (
                <span className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                  {event.triggeredBy === "manual" ? <Activity size={10} /> : <Clock size={10} />}
                  {event.triggeredBy}
                </span>
              )}
              {event.model && (
                <span className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground">{event.model}</span>
              )}
              {durationStr && (
                <span className="text-xs text-muted-foreground">{durationStr}</span>
              )}
              {linkedBriefs.length > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <FileText size={10} />
                  {linkedBriefs.length} brief{linkedBriefs.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <span className="text-xs text-muted-foreground">{formatRelativeTime(event.createdAt)}</span>
            {hasContent && (
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            )}
          </div>
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
              <div className="relative mt-2 rounded-lg bg-accent/50 p-3 space-y-2">
                <HeartbeatDetails items={summaryItems} status={event.status} />
                {event.detail && (
                  <div className="text-xs text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto border-t border-border pt-2 mt-2">
                    {event.detail}
                  </div>
                )}
                {linkedBriefs.length > 0 && (
                  <LinkedBriefsList briefs={linkedBriefs} />
                )}
                <div className="flex justify-end">
                  <CopyButton text={buildCopyText(event, summaryItems, linkedBriefs)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function HeartbeatDetails({ items, status }: { items: string[]; status: string }) {
  return (
    <ul className="space-y-1" role="list">
      {items.map((item, i) => {
        const isIssue = status === "failure" ||
          /fail|error|missing|anomal|unsupported|broken/i.test(item)
        return (
          <li key={i} className="flex items-start gap-2 text-xs">
            {isIssue ? (
              <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="text-foreground">{item}</span>
          </li>
        )
      })}
    </ul>
  )
}

function LinkedBriefsList({ briefs }: { briefs: LinkedBrief[] }) {
  return (
    <div className="border-t border-border pt-2 mt-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">Linked Briefs</p>
      <div className="space-y-1">
        {briefs.map((brief) => (
          <Link
            key={brief.id}
            href="/brief"
            className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FileText size={12} aria-hidden="true" />
            <span>{brief.title}</span>
            <span className="text-muted-foreground">({brief.briefType})</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function HeartbeatTimeline({ events, total, onLoadMore }: HeartbeatTimelineProps) {
  const [briefMap, setBriefMap] = useState<Record<string, LinkedBrief[]>>({})

  useEffect(() => {
    if (events.length === 0) return
    const earliest = events[events.length - 1]?.createdAt
    const from = earliest?.slice(0, 10)
    if (!from) return

    fetch(`/api/briefs?from=${from}&to=2099-12-31`)
      .then((r) => r.json())
      .then((data) => {
        const briefs = data.briefs || []
        const map: Record<string, LinkedBrief[]> = {}
        for (const event of events) {
          const eventTime = new Date(event.createdAt).getTime()
          const matched = briefs.filter((b: { createdAt: string }) => {
            const briefTime = new Date(b.createdAt).getTime()
            const diff = Math.abs(briefTime - eventTime)
            return diff < 30 * 60 * 1000 // within 30 minutes
          })
          if (matched.length > 0) {
            map[event.id] = matched.map((b: { id: string; briefType: string; title: string }) => ({
              id: b.id,
              briefType: b.briefType,
              title: b.title,
            }))
          }
        }
        setBriefMap(map)
      })
      .catch(() => {})
  }, [events])

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">No heartbeat events recorded yet</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">Event Timeline</h3>
      <div className="space-y-0">
        {events.map((event) => (
          <HeartbeatEventItem
            key={event.id}
            event={event}
            linkedBriefs={briefMap[event.id] || []}
          />
        ))}
      </div>
      {events.length < total && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Load more ({total - events.length} remaining)
        </button>
      )}
    </div>
  )
}
