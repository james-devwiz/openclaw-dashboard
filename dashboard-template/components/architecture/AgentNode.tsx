"use client" // ReactFlow custom node component, requires client-side rendering

import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { AgentNodeData } from "@/types/index"

const TYPE_COLOURS: Record<string, string> = {
  main: "bg-blue-500",
  contextual: "bg-purple-500",
  sub: "bg-teal-500",
}

const TYPE_BORDERS: Record<string, string> = {
  main: "border-blue-200 dark:border-blue-800",
  contextual: "border-purple-200 dark:border-purple-800",
  sub: "border-teal-200 dark:border-teal-800",
}

export default function AgentNode({ data }: NodeProps) {
  const { agent } = data as unknown as AgentNodeData

  return (
    <div className={cn("rounded-xl border-2 bg-card p-4 shadow-md w-[300px]", TYPE_BORDERS[agent.type])}>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />

      <div className="flex items-center gap-2 mb-2">
        <span className={cn("size-3 rounded-full", TYPE_COLOURS[agent.type])} />
        <span className="font-semibold text-sm text-foreground">{agent.name}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">{agent.type}</span>
      </div>

      {agent.live && (
        <code className="inline-block px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground mb-2">
          {agent.live.model}
        </code>
      )}

      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{agent.description}</p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground font-medium">
          {agent.readySkillCount}/{agent.totalSkillCount} skills
        </span>
        {agent.live?.heartbeat.enabled && (
          <span className="text-muted-foreground">{agent.live.heartbeat.interval}m heartbeat</span>
        )}
      </div>
    </div>
  )
}
