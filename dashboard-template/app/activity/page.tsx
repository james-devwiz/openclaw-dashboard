"use client" // Requires useActivity hook for data fetching and filter state

import { Button } from "@/components/ui/button"
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
                <Button variant="secondary" onClick={loadMore} aria-label="Load more activity">
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
