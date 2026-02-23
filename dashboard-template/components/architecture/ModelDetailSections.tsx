import { Bot, Clock, MessageSquare, Activity } from "lucide-react"

import type { ModelDetail } from "@/types/index"

export function ModelInfoSection({ detail }: { detail: ModelDetail }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Model Info</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">ID</dt>
        <dd className="text-foreground font-mono text-xs truncate">{detail.id}</dd>
        <dt className="text-muted-foreground">Alias</dt>
        <dd className="text-foreground">{detail.alias}</dd>
        <dt className="text-muted-foreground">Provider</dt>
        <dd className="text-foreground">{detail.provider}</dd>
        <dt className="text-muted-foreground">Role</dt>
        <dd className="text-foreground">{detail.role}</dd>
      </dl>
    </section>
  )
}

export function AgentsSection({ agents }: { agents: ModelDetail["agents"] }) {
  if (agents.length === 0) return null
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Bot size={14} aria-hidden="true" />
        Agents ({agents.length})
      </h3>
      <ul className="space-y-1">
        {agents.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-sm text-foreground py-1 px-2 rounded-md bg-muted/50">
            <span className="font-medium">{a.name}</span>
            <span className="text-xs text-muted-foreground">{a.id}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CronJobsSection({ cronJobs }: { cronJobs: ModelDetail["cronJobs"] }) {
  if (cronJobs.length === 0) return null
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Clock size={14} aria-hidden="true" />
        Cron Jobs ({cronJobs.length})
      </h3>
      <ul className="space-y-1">
        {cronJobs.map((j) => (
          <li key={j.name} className="flex items-center justify-between text-sm py-1 px-2 rounded-md bg-muted/50">
            <span className="font-medium text-foreground">{j.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{j.schedule}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TopicsSection({ topics }: { topics: string[] }) {
  if (topics.length === 0) return null
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <MessageSquare size={14} aria-hidden="true" />
        Topics ({topics.length})
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground capitalize">
            {t}
          </span>
        ))}
      </div>
    </section>
  )
}

export function HeartbeatSection() {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Activity size={14} aria-hidden="true" />
        Heartbeat
      </h3>
      <p className="text-sm text-muted-foreground">
        This model powers the heartbeat health check cycle.
      </p>
    </section>
  )
}
