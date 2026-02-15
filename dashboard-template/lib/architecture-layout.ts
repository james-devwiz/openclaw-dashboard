import dagre from "@dagrejs/dagre"
import type { Node, Edge } from "@xyflow/react"
import type { ArchitectureData } from "@/types/index"

const NODE_SIZES = {
  agent: { width: 300, height: 140 },
  business: { width: 240, height: 80 },
  skillGroup: { width: 360, height: 150 },
}

export function buildFlowLayout(data: ArchitectureData): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 100 })
  g.setDefaultEdgeLabel(() => ({}))

  const mainAgent = data.agents.find((a) => a.type === "main")
  if (!mainAgent) return { nodes: [], edges: [] }

  g.setNode(`agent-${mainAgent.id}`, NODE_SIZES.agent)

  for (const biz of data.businesses) {
    g.setNode(`biz-${biz.id}`, NODE_SIZES.business)
    g.setEdge(`agent-${mainAgent.id}`, `biz-${biz.id}`)
  }

  g.setNode(`skills-${mainAgent.id}`, NODE_SIZES.skillGroup)
  g.setEdge(`agent-${mainAgent.id}`, `skills-${mainAgent.id}`)

  dagre.layout(g)

  const nodes: Node[] = []

  const agentPos = g.node(`agent-${mainAgent.id}`)
  nodes.push({
    id: `agent-${mainAgent.id}`,
    type: "agent",
    position: { x: agentPos.x - agentPos.width / 2, y: agentPos.y - agentPos.height / 2 },
    data: { agent: mainAgent },
  })

  for (const biz of data.businesses) {
    const pos = g.node(`biz-${biz.id}`)
    nodes.push({
      id: `biz-${biz.id}`,
      type: "business",
      position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 },
      data: { business: biz },
    })
  }

  const skillPos = g.node(`skills-${mainAgent.id}`)
  nodes.push({
    id: `skills-${mainAgent.id}`,
    type: "skillGroup",
    position: { x: skillPos.x - skillPos.width / 2, y: skillPos.y - skillPos.height / 2 },
    data: { agentId: mainAgent.id, skills: data.skills },
  })

  const edges: Edge[] = []
  for (const biz of data.businesses) {
    edges.push({
      id: `e-${mainAgent.id}-${biz.id}`,
      source: `agent-${mainAgent.id}`,
      target: `biz-${biz.id}`,
      type: "smoothstep",
      animated: true,
    })
  }
  edges.push({
    id: `e-${mainAgent.id}-skills`,
    source: `agent-${mainAgent.id}`,
    target: `skills-${mainAgent.id}`,
    type: "smoothstep",
    style: { strokeDasharray: "5 5" },
  })

  return { nodes, edges }
}
