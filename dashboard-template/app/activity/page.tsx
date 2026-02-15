"use client" // Requires useActivity hook for data fetching and filter state

import { useActivity } from "@/hooks/useActivity"
import PageHeader from "@/components/layout/PageHeader"
import { ActivityTimeline } from "@/components/activity/ActivityTimeline"
import { ActivityFilters } from "@/components/activity/ActivityFilters"

export default function ActivityPage() {
  const { items, loading, total, entityType, setEntityType, loadMore } = useActivity()

  return (
    <>
      <PageHeader title="Activity" subtitle="Timeline of all dashboard actions" />

      <div className="space-y-6">
        <ActivityFilters selected={entityType} onSelect={setEntityType} />

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading activity...</p>
          </div>
        ) : (
          <>
            <ActivityTimeline items={items} />
            {items.length < total && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Load more activity"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
