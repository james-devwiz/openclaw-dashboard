"use client" // Requires interactive onClick handlers for row expand, trigger, sort, goal select

import Link from "next/link"
import {
  Play, Clock, ChevronDown, ChevronRight, Check, ArrowUp, ArrowDown,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cronToHuman } from "@/lib/task-constants"
import { cn, formatRelativeTime } from "@/lib/utils"
import { STATUS_CONFIG, buildChannels } from "./recurring-shared"
import type { RecurringListProps, SortField, SortDir } from "./recurring-shared"

function SortHeader({ label, field, sortField, sortDir, onSort }: {
  label: string; field: SortField; sortField: SortField; sortDir: SortDir; onSort: (f: SortField) => void
}) {
  const active = sortField === field
  const Icon = active && sortDir === "desc" ? ArrowDown : ArrowUp
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 group/sort" aria-label={`Sort by ${label}`}>
      {label}
      <Icon size={12} className={cn("transition-opacity", active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-40")} aria-hidden="true" />
    </button>
  )
}

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

export default function RecurringDesktop({ jobs, goals, expanded, triggered, sortField, sortDir, onSort, onToggle, onTrigger, onGoalChange }: RecurringListProps) {
  return (
    <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-left">
            <th className="px-4 py-3 font-medium w-8"></th>
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Goal</th>
            <th className="px-4 py-3 font-medium">Frequency</th>
            <th className="px-4 py-3 font-medium">Model</th>
            <th className="px-4 py-3 font-medium">Channels</th>
            <th className="px-4 py-3 font-medium">
              {onSort && sortField && sortDir
                ? <SortHeader label="Last Run" field="lastRun" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                : "Last Run"}
            </th>
            <th className="px-4 py-3 font-medium">
              {onSort && sortField && sortDir
                ? <SortHeader label="Next Run" field="nextRun" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                : "Next Run"}
            </th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isOpen = expanded.has(job.name)
            const justTriggered = triggered.has(job.name)
            const statusCfg = job.lastStatus ? STATUS_CONFIG[job.lastStatus] : null
            const StatusIcon = statusCfg?.icon || Clock
            return (
              <>
                <tr
                  key={job.name}
                  className={cn("border-b border-border hover:bg-muted/30 transition-colors cursor-pointer", isOpen && "bg-muted/20")}
                  onClick={() => onToggle(job.name)}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{job.name}</td>
                  <td className="px-4 py-3">
                    <GoalSelect jobName={job.name} goalId={job.goalId} goals={goals} onChange={onGoalChange} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cronToHuman(job.schedule)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Link href="/architecture?tab=models" aria-label={`View model ${job.model} in Architecture`}>
                      <Badge variant="outline" className="text-[10px] font-mono hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer transition-colors">{job.model}</Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{buildChannels(job)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{job.lastRun ? formatRelativeTime(job.lastRun) : "-"}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{job.nextRun ? formatRelativeTime(job.nextRun) : "-"}</td>
                  <td className="px-4 py-3">
                    {statusCfg ? (
                      <Badge variant={statusCfg.badge}>
                        <StatusIcon size={10} className={cn("mr-1", statusCfg.spin && "animate-spin")} aria-hidden="true" />
                        {statusCfg.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Idle</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTrigger(job.name)}
                      disabled={job.enabled === false || justTriggered}
                      className={cn(
                        justTriggered && "border-green-500/30 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      )}
                      aria-label={`Trigger ${job.name} now`}
                    >
                      {justTriggered ? <><Check size={10} aria-hidden="true" />Triggered</> : <><Play size={10} aria-hidden="true" />Run</>}
                    </Button>
                  </td>
                </tr>
                {isOpen && (
                  <tr key={`${job.name}-detail`} className="border-b border-border bg-muted/10">
                    <td colSpan={10} className="px-8 py-4">
                      {job.prompt ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Prompt</p>
                          <p className="text-xs text-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                            {job.prompt}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">System event — managed internally by OpenClaw (no agent prompt)</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
