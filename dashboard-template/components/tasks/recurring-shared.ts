import { Loader2, XCircle, CheckCircle2 } from "lucide-react"

import type { CronJob, Goal } from "@/types/index"

export type SortField = "nextRun" | "lastRun"
export type SortDir = "asc" | "desc"

export interface RecurringListProps {
  jobs: CronJob[]
  goals: Goal[]
  expanded: Set<string>
  triggered: Set<string>
  sortField?: SortField
  sortDir?: SortDir
  onSort?: (field: SortField) => void
  onToggle: (name: string) => void
  onTrigger: (name: string) => void
  onGoalChange: (jobName: string, goalId: string) => void
}

export const STATUS_CONFIG = {
  running: { icon: Loader2, badge: "default" as const, label: "Running", spin: true },
  failure: { icon: XCircle, badge: "error" as const, label: "Failed", spin: false },
  success: { icon: CheckCircle2, badge: "success" as const, label: "OK", spin: false },
} as const

export function buildChannels(job: { target?: { channel: string }; sessionTarget?: string }): string {
  const channels: string[] = ["Command Centre"]
  if (job.target?.channel) channels.push(job.target.channel.charAt(0).toUpperCase() + job.target.channel.slice(1))
  return channels.join(", ")
}
