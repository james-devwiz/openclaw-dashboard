"use client" // Requires framer-motion for staggered mount animation

import Link from "next/link"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"

import { cn, formatRelativeTime } from "@/lib/utils"
import { getActivityConfig, getActionLabel } from "@/lib/activity-utils"

import type { ActivityItem } from "@/types/activity.types"
import type { ActivityEntityType } from "@/types/activity.types"

const ENTITY_ROUTES: Partial<Record<ActivityEntityType, string>> = {
  task: "/goals",
  goal: "/goals",
  content: "/content",
  approval: "/approvals",
  brief: "/brief",
  heartbeat: "/heartbeat",
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const visible = items.slice(0, 8)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Link
          href="/activity"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          aria-label="View all activity"
        >
          View all
        </Link>
      </div>
      <div role="list" aria-label="Recent activity">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          visible.map((item, i) => {
            const config = getActivityConfig(item.entityType)
            const Icon = config.icon
            const isLast = i === visible.length - 1
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
                className="relative flex items-center gap-3 py-2.5"
                role="listitem"
              >
                {/* Dashed connecting line */}
                {!isLast && (
                  <div className="absolute left-[13px] top-10 bottom-0 w-px border-l border-dashed border-border" />
                )}
                {/* Icon dot */}
                <div className={cn("relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full", config.bg)}>
                  <Icon className={cn("size-3", config.fg)} aria-hidden="true" />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-medium">{item.entityName}</span>
                    {ENTITY_ROUTES[item.entityType] && (
                      <Link
                        href={ENTITY_ROUTES[item.entityType]!}
                        className="inline-flex ml-1 text-muted-foreground hover:text-foreground transition-colors align-middle"
                        aria-label={`Go to ${item.entityType}`}
                      >
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                    <span className="text-muted-foreground"> {getActionLabel(item.action).toLowerCase()}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(item.createdAt)}</span>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
