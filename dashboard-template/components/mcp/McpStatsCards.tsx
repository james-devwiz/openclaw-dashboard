"use client" // Renders stat cards from observability data

import { Activity, CheckCircle, Clock, Server } from "lucide-react"

import type { McpObservabilityStats } from "@/types/mcp.types"

interface McpStatsCardsProps {
  stats: McpObservabilityStats
}

const CARDS = [
  { key: "totalCalls", label: "Total Calls", icon: Activity, format: (v: number) => String(v) },
  { key: "successRate", label: "Success Rate", icon: CheckCircle, format: (v: number) => `${v}%` },
  { key: "avgLatencyMs", label: "Avg Latency", icon: Clock, format: (v: number) => `${v}ms` },
  { key: "servers", label: "Active Servers", icon: Server, format: (v: number) => String(v) },
] as const

export default function McpStatsCards({ stats }: McpStatsCardsProps) {
  const values = {
    totalCalls: stats.totalCalls,
    successRate: stats.successRate,
    avgLatencyMs: stats.avgLatencyMs,
    servers: stats.callsByServer.length,
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {CARDS.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Icon size={14} aria-hidden="true" />
            <span className="text-xs">{label}</span>
          </div>
          <p className="text-2xl font-semibold">{format(values[key])}</p>
        </div>
      ))}
    </div>
  )
}
