"use client" // Requires useEntityActivities hook for data fetching

import { History } from "lucide-react"

import { ActivityTimeline } from "@/components/activity/ActivityTimeline"
import { useEntityActivities } from "@/hooks/useEntityActivities"

interface TaskActivitySectionProps {
  taskId: string
}

export default function TaskActivitySection({ taskId }: TaskActivitySectionProps) {
  const { items, loading } = useEntityActivities("task", taskId)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <History size={14} className="text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">Activity</h3>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground">({items.length})</span>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading activity...</p>
      ) : (
        <ActivityTimeline items={items} />
      )}
    </div>
  )
}
