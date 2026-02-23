"use client" // Requires hooks for client-side data fetching and polling

import { RefreshCw, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/layout/PageHeader"
import { StatusCards } from "@/components/overview/StatusCards"
import { ChannelStatusCard } from "@/components/overview/ChannelStatusCard"
import { SystemResourcesCard } from "@/components/overview/SystemResourcesCard"
import { ActivityFeed } from "@/components/overview/ActivityFeed"
import { useGateway } from "@/hooks/useGateway"
import { useTasks } from "@/hooks/useTasks"
import { useCron } from "@/hooks/useCron"
import { useActivity } from "@/hooks/useActivity"
import { useGoals } from "@/hooks/useGoals"
import { useApprovals } from "@/hooks/useApprovals"

export default function OverviewPage() {
  const { health, config, loading: healthLoading, error: healthError, refetch } = useGateway()
  const { tasks } = useTasks()
  const { jobs } = useCron()
  const { items: activity } = useActivity({ limit: 10 })
  const { goals } = useGoals()
  const { pendingCount } = useApprovals()

  const taskCounts = {
    todo: tasks.filter((t) => t.status === "Backlog" || t.status === "To Do This Week").length,
    progress: tasks.filter((t) => t.status === "In Progress").length,
    blocked: tasks.filter((t) => t.status === "Blocked").length,
  }

  const activeGoals = goals.filter((g) => g.status === "Active")
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0

  return (
    <div>
      <PageHeader
        title="Command Centre"
        subtitle="AI Assistant — OpenClaw Dashboard"
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
        }
      />

      <StatusCards
        health={health}
        config={config}
        healthLoading={healthLoading}
        taskCounts={taskCounts}
        cronJobCount={jobs.length}
        cronFailCount={jobs.filter((j) => j.lastStatus === "failure").length}
      />

      {/* Goals & Approvals stat row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="font-medium text-muted-foreground mb-1">Goals Progress</h3>
          <p className="text-2xl font-bold text-foreground">{activeGoals.length} active</p>
          <p className="text-sm text-muted-foreground mt-1">
            {avgProgress}% average progress
          </p>
        </div>
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="font-medium text-muted-foreground mb-1">Pending Approvals</h3>
          <p className={cn("text-2xl font-bold", pendingCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
            {pendingCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount > 0 ? "Requires your attention" : "All clear"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <div className="space-y-6">
          <ChannelStatusCard health={health} />
          <SystemResourcesCard health={health} />
        </div>
      </div>

      {healthError && (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <WifiOff size={16} aria-hidden="true" />
            <span className="text-sm font-medium">Gateway Connection Error</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{healthError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Ensure the SSH tunnel is running:{" "}
            <code className="bg-muted px-1 rounded">lsof -i :18789</code>
          </p>
        </div>
      )}
    </div>
  )
}
