"use client" // Requires framer-motion for mount animation

import { groupActivitiesByDate } from "@/lib/activity-utils"
import { ActivityTimelineItem } from "./ActivityTimelineItem"

import type { ActivityItem } from "@/types/activity.types"

interface ActivityTimelineProps {
  items: ActivityItem[]
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">Actions on tasks, goals, content, and approvals will appear here</p>
      </div>
    )
  }

  const groups = groupActivitiesByDate(items)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="sticky top-0 z-10 mb-3">
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-muted-foreground">
              {group.date}
            </span>
          </div>
          <div>
            {group.items.map((item, i) => (
              <ActivityTimelineItem
                key={item.id}
                item={item}
                isLast={i === group.items.length - 1}
                index={i}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
