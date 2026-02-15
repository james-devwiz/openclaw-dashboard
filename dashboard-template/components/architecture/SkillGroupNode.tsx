"use client" // ReactFlow custom node component, requires client-side rendering

import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { SkillGroupNodeData } from "@/types/index"

export default function SkillGroupNode({ data }: NodeProps) {
  const { skills } = data as unknown as SkillGroupNodeData
  const ready = skills.filter((s) => s.status === "ready")
  const missing = skills.filter((s) => s.status === "missing")

  return (
    <div className="rounded-xl border border-dashed border-border bg-card/80 p-3 shadow-sm w-[360px]">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">
          Skills ({ready.length}/{skills.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ready.slice(0, 20).map((s) => (
          <span
            key={s.name}
            className="relative text-sm"
            title={`${s.name} (ready)`}
          >
            {s.emoji}
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-green-500" />
          </span>
        ))}
        {missing.slice(0, 10).map((s) => (
          <span
            key={s.name}
            className={cn("relative text-sm opacity-40")}
            title={`${s.name} (missing)`}
          >
            {s.emoji}
            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-red-400" />
          </span>
        ))}
        {ready.length + missing.length > 30 && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            +{skills.length - 30} more
          </span>
        )}
      </div>
    </div>
  )
}
