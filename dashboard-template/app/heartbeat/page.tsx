"use client" // Requires useHeartbeats hook for paginated event fetching and polling

import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import { HeartbeatStatCards } from "@/components/heartbeat/HeartbeatStatCards"
import { HeartbeatConfig } from "@/components/heartbeat/HeartbeatConfig"
import { HeartbeatTimeline } from "@/components/heartbeat/HeartbeatTimeline"
import { useHeartbeats } from "@/hooks/useHeartbeats"

export default function HeartbeatPage() {
  const { events, stats, total, loading, loadMore, refetch } = useHeartbeats()

  return (
    <div>
      <PageHeader
        title="Heartbeat Monitor"
        subtitle="Track heartbeat history and system health"
        actions={
          <Button variant="outline" size="icon" onClick={refetch} aria-label="Refresh heartbeats">
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
        }
      />

      <HeartbeatStatCards stats={stats} />
      <HeartbeatConfig onTriggered={refetch} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <HeartbeatTimeline events={events} total={total} onLoadMore={loadMore} />
      )}
    </div>
  )
}
