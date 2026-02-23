"use client" // Requires useState for brief map state and useEffect for brief fetching

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import HeartbeatEventItem from "./HeartbeatEventItem"

import type { LinkedBrief } from "./HeartbeatEventItem"
import type { HeartbeatEvent } from "@/types"

interface HeartbeatTimelineProps {
  events: HeartbeatEvent[]
  total: number
  onLoadMore: () => void
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
            return diff < 30 * 60 * 1000
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
        <Button
          variant="ghost"
          onClick={onLoadMore}
          className="w-full text-blue-600 dark:text-blue-400 hover:underline"
        >
          Load more ({total - events.length} remaining)
        </Button>
      )}
    </div>
  )
}
