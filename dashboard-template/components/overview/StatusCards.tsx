"use client" // Requires conditional rendering based on parent's hook-driven state

import Link from "next/link"
import { Zap, KanbanSquare, Timer, Activity, TrendingUp, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"

import type { HealthStatus, GatewayConfig } from "@/types/index"
import type { LucideIcon } from "lucide-react"

interface StatusCardsProps {
  health: HealthStatus | null
  config: GatewayConfig | null
  healthLoading: boolean
  taskCounts: { todo: number; progress: number; blocked: number }
  cronJobCount: number
  cronFailCount: number
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
  trendUp,
  href,
}: {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  subtitle: string
  trendUp: boolean | null
  href?: string
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
        </div>
        {trendUp !== null && (
          trendUp ? (
            <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
          )
        )}
      </div>
      <h3 className="font-medium text-muted-foreground mb-1">{label}</h3>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className={cn(
        "text-sm mt-1",
        trendUp === true && "text-green-600 dark:text-green-400",
        trendUp === false && "text-red-600 dark:text-red-400",
        trendUp === null && "text-muted-foreground",
      )}>
        {subtitle}
      </p>
    </>
  )

  const className = "p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow block"

  if (href) return <Link href={href} className={className}>{content}</Link>
  return <div className={className}>{content}</div>
}

export function StatusCards({
  health,
  config,
  healthLoading,
  taskCounts,
  cronJobCount,
  cronFailCount,
}: StatusCardsProps) {
  const isHealthy = health?.status === "healthy"
  const gatewayStatus = healthLoading ? "..." : health?.status || "unknown"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={Zap}
        iconBg={isHealthy ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}
        iconColor={isHealthy ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        label="Gateway"
        value={gatewayStatus.charAt(0).toUpperCase() + gatewayStatus.slice(1)}
        subtitle={isHealthy ? "All systems operational" : "Connection issues detected"}
        trendUp={isHealthy ? true : health ? false : null}
      />

      <StatCard
        icon={KanbanSquare}
        iconBg="bg-blue-50 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
        label="Active Tasks"
        value={taskCounts.progress}
        subtitle={`${taskCounts.todo} to do \u00b7 ${taskCounts.blocked} blocked`}
        trendUp={taskCounts.blocked === 0 ? true : false}
      />

      <StatCard
        icon={Timer}
        iconBg="bg-purple-50 dark:bg-purple-900/20"
        iconColor="text-purple-600 dark:text-purple-400"
        label="Cron Jobs"
        value={cronJobCount}
        subtitle={cronFailCount > 0 ? `${cronFailCount} failed recently` : "All running normally"}
        trendUp={cronFailCount === 0 ? true : false}
        href="/goals?tab=recurring"
      />

      <StatCard
        icon={Activity}
        iconBg="bg-orange-50 dark:bg-orange-900/20"
        iconColor="text-orange-600 dark:text-orange-400"
        label="Heartbeat"
        value={config?.heartbeat?.enabled ? "Active" : "Off"}
        subtitle={
          config?.heartbeat?.interval
            ? `Every ${config.heartbeat.interval}min`
            : "Not configured"
        }
        trendUp={config?.heartbeat?.enabled ? true : null}
      />
    </div>
  )
}
