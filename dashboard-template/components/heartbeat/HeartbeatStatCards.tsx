"use client" // Requires props for rendering stat data

import { HeartPulse, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"

import type { HeartbeatStats } from "@/types"

interface HeartbeatStatCardsProps {
  stats: HeartbeatStats | null
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: {
  icon: React.ElementType; label: string; value: string | number; iconBg: string; iconColor: string
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function HeartbeatStatCards({ stats }: HeartbeatStatCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm animate-pulse h-[72px]" />
        ))}
      </div>
    )
  }

  const successRate = stats.total > 0 ? Math.round((stats.successCount / stats.total) * 100) : 0
  const lastBeat = stats.lastHeartbeat ? formatRelativeTime(stats.lastHeartbeat) : "Never"
  const avgDurationSec = stats.avgDuration > 0 ? `${(stats.avgDuration / 1000).toFixed(1)}s` : "—"

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard icon={HeartPulse} label="Total Heartbeats" value={stats.total}
        iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
      <StatCard icon={CheckCircle2} label="Success Rate" value={`${successRate}%`}
        iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
      <StatCard icon={Clock} label="Last Heartbeat" value={lastBeat}
        iconBg="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-600 dark:text-purple-400" />
      <StatCard icon={XCircle} label="Avg Duration" value={avgDurationSec}
        iconBg="bg-orange-50 dark:bg-orange-900/20" iconColor="text-orange-600 dark:text-orange-400" />
    </div>
  )
}
