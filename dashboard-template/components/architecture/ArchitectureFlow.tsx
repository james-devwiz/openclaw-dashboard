"use client" // ReactFlow requires client-side rendering for canvas, zoom, pan, and drag interactions

import { useMemo, useState, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { buildFlowLayout } from "@/lib/architecture-layout"
import AgentNode from "./AgentNode"
import BusinessNode from "./BusinessNode"
import SkillGroupNode from "./SkillGroupNode"
import type { ArchitectureData } from "@/types/index"

const nodeTypes = {
  agent: AgentNode,
  business: BusinessNode,
  skillGroup: SkillGroupNode,
}

interface ArchitectureFlowProps {
  data: ArchitectureData
}

export default function ArchitectureFlow({ data }: ArchitectureFlowProps) {
  const layout = useMemo(() => buildFlowLayout(data), [data])
  const [nodes, , onNodesChange] = useNodesState(layout.nodes)
  const [edges] = useEdgesState(layout.edges)

  return (
    <div className="h-[600px] rounded-xl border border-border bg-card overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        nodesDraggable
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "agent") return "#3b82f6"
            if (node.type === "business") return "#8b5cf6"
            return "#6b7280"
          }}
        />
      </ReactFlow>
    </div>
  )
}
