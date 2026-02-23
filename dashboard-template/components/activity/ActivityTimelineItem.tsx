"use client" // Requires useState for expand/collapse state

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ExternalLink } from "lucide-react"

import { cn, formatRelativeTime } from "@/lib/utils"
import { getActivityConfig, getActionLabel } from "@/lib/activity-utils"

import type { ActivityItem } from "@/types/activity.types"
import type { ActivityEntityType } from "@/types/activity.types"

const ENTITY_ROUTES: Partial<Record<ActivityEntityType, string>> = {
  task: "/goals",
  goal: "/goals",
  content: "/studio",
  post: "/studio",
  approval: "/approvals",
  brief: "/brief",
  heartbeat: "/heartbeat",
}

interface ActivityTimelineItemProps {
  item: ActivityItem
  isLast: boolean
  index: number
}

export function ActivityTimelineItem({ item, isLast, index }: ActivityTimelineItemProps) {
  const [expanded, setExpanded] = useState(false)
  const config = getActivityConfig(item.entityType)
  const Icon = config.icon
  const hasChanges = item.changes && item.changes !== "" && item.changes !== "{}"

  const parsedChanges: Record<string, [unknown, unknown]> = hasChanges ? (() => {
    try { return JSON.parse(item.changes) } catch { return {} }
  })() : {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="relative flex gap-4 pl-1"
    >
      {/* Vertical dashed line */}
      {!isLast && (
        <div className="absolute left-[17px] top-10 bottom-0 w-px border-l border-dashed border-border" />
      )}

      {/* Entity type icon dot */}
      <div className={cn("relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", config.bg)}>
        <Icon className={cn("size-3.5", config.fg)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div
          className={cn("flex items-start gap-2", hasChanges && "cursor-pointer")}
          onClick={() => hasChanges && setExpanded(!expanded)}
          role={hasChanges ? "button" : undefined}
          aria-expanded={hasChanges ? expanded : undefined}
          aria-label={hasChanges ? `${item.entityName} — expand details` : undefined}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {item.entityName}
              {ENTITY_ROUTES[item.entityType] && (
                <Link
                  href={ENTITY_ROUTES[item.entityType]!}
                  className="inline-flex ml-1.5 text-muted-foreground hover:text-foreground transition-colors align-middle"
                  aria-label={`Go to ${item.entityType}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{item.source === "dashboard" ? "You" : "AI Assistant"}</span>
              {" "}{getActionLabel(item.action).toLowerCase()}
              {item.detail && ` — ${item.detail}`}
              {item.source && item.source !== "dashboard" && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                  {item.source}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
            {hasChanges && (
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            )}
          </div>
        </div>

        {/* Expandable changes */}
        <AnimatePresence>
          {expanded && Object.keys(parsedChanges).length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-lg bg-accent/50 p-3 space-y-1">
                {Object.entries(parsedChanges).map(([field, [oldVal, newVal]]) => (
                  <div key={field} className="text-xs">
                    <span className="font-medium text-muted-foreground">{field}:</span>{" "}
                    <span className="text-red-500 line-through">{String(oldVal || "—")}</span>{" "}
                    <span className="text-green-600 dark:text-green-400">{String(newVal || "—")}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
