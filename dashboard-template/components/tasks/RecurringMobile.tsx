"use client" // Requires interactive onClick handlers for row expand, trigger, goal select

import { Play, Clock, ChevronDown, ChevronRight, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cronToHuman } from "@/lib/task-constants"
import { cn, formatRelativeTime } from "@/lib/utils"
import { STATUS_CONFIG, buildChannels } from "./recurring-shared"
import type { RecurringListProps } from "./recurring-shared"

function GoalSelect({ jobName, goalId, goals, onChange }: {
  jobName: string; goalId?: string; goals: RecurringListProps["goals"]; onChange: RecurringListProps["onGoalChange"]
}) {
  return (
    <select
      value={goalId || ""}
      onChange={(e) => { e.stopPropagation(); onChange(jobName, e.target.value) }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[140px] rounded border border-border bg-muted/50 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      aria-label={`Goal for ${jobName}`}
    >
      <option value="">No goal</option>
      {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
    </select>
  )
}

export default function RecurringMobile({ jobs, goals, expanded, triggered, onToggle, onTrigger, onGoalChange }: RecurringListProps) {
  return (
    <div className="md:hidden grid grid-cols-1 gap-4" role="list" aria-label="Cron job list">
      {jobs.map((job) => {
        const isOpen = expanded.has(job.name)
        const justTriggered = triggered.has(job.name)
        const statusCfg = job.lastStatus ? STATUS_CONFIG[job.lastStatus] : null
        const StatusIcon = statusCfg?.icon || Clock
        return (
          <div key={job.name} className="rounded-xl border border-border bg-card shadow-sm p-4" role="listitem">
            <button onClick={() => onToggle(job.name)} className="w-full flex items-start justify-between mb-2 text-left">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span className="font-semibold text-sm text-foreground">{job.name}</span>
              </div>
              {statusCfg && (
                <Badge variant={statusCfg.badge}>
                  <StatusIcon size={10} className={cn("mr-1", statusCfg.spin && "animate-spin")} aria-hidden="true" />
                  {statusCfg.label}
                </Badge>
              )}
            </button>
            <div className="text-xs text-muted-foreground space-y-1 mb-3">
              <p>{cronToHuman(job.schedule)} &middot; {buildChannels(job)}</p>
              {job.nextRun && <p className="text-foreground font-medium">Next: {formatRelativeTime(job.nextRun)}</p>}
              <GoalSelect jobName={job.name} goalId={job.goalId} goals={goals} onChange={onGoalChange} />
            </div>
            {isOpen && (
              job.prompt ? (
                <p className="text-xs text-foreground bg-muted rounded-lg p-3 mb-3 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                  {job.prompt}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic mb-3">System event — no agent prompt</p>
              )
            )}
            <button
              onClick={() => onTrigger(job.name)}
              disabled={job.enabled === false || justTriggered}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs",
                justTriggered
                  ? "border-green-500/30 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                  : "border-border hover:bg-accent disabled:opacity-50"
              )}
              aria-label={`Trigger ${job.name}`}
            >
              {justTriggered ? <><Check size={10} />Triggered</> : <><Play size={10} />Run</>}
            </button>
          </div>
        )
      })}
    </div>
  )
}
