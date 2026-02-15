"use client" // ReactFlow custom node component, requires client-side rendering

import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"

import type { BusinessNodeData } from "@/types/index"

export default function BusinessNode({ data }: NodeProps) {
  const { business } = data as unknown as BusinessNodeData

  return (
    <div
      className="rounded-lg bg-card border border-border p-3 shadow-sm w-[240px]"
      style={{ borderLeftWidth: 4, borderLeftColor: business.colour }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <span className="font-medium text-sm text-foreground block">{business.name}</span>
      <span className="text-xs text-muted-foreground">{business.description}</span>
    </div>
  )
}
