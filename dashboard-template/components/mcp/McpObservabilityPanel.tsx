"use client" // Time range selector and observability data display

import { useState } from "react"

import { cn } from "@/lib/utils"
import { useMcpObservability } from "@/hooks/useMcpObservability"
import McpStatsCards from "./McpStatsCards"
import McpCallLogTable from "./McpCallLogTable"

const TIME_RANGES = [
  { id: 1, label: "1h" },
  { id: 6, label: "6h" },
  { id: 24, label: "24h" },
  { id: 168, label: "7d" },
]

export default function McpObservabilityPanel() {
  const [hours, setHours] = useState(24)
  const { stats, logs, logsTotal, loading, loadMoreLogs } = useMcpObservability(hours)

  if (loading) return <p className="text-muted-foreground text-sm">Loading observability data...</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-muted-foreground">Time range:</span>
        {TIME_RANGES.map((r) => (
          <button
            key={r.id} onClick={() => setHours(r.id)}
            className={cn("px-2.5 py-1 text-xs rounded-md transition-colors", hours === r.id ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:bg-muted")}
          >
            {r.label}
          </button>
        ))}
      </div>

      {stats && <McpStatsCards stats={stats} />}

      <h3 className="text-sm font-medium mb-3">Call Logs</h3>
      <McpCallLogTable logs={logs} total={logsTotal} onLoadMore={loadMoreLogs} />
    </div>
  )
}
