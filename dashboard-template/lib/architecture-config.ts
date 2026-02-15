import type { AgentDefinition, BusinessDefinition } from "@/types/index"
import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "./architecture-agents"
import { SITE_CONFIG } from "@/lib/site-config"

export const BUSINESSES: BusinessDefinition[] = SITE_CONFIG.businesses.map((b) => ({
  id: b.id,
  name: b.name,
  description: b.description,
  colour: b.colour,
}))

export const AGENTS: AgentDefinition[] = [
  {
    id: "main",
    name: SITE_CONFIG.aiName,
    type: "main",
    description: "AI Chief of Staff — orchestrates all agents across all domains",
    businesses: SITE_CONFIG.businesses.map((b) => b.id),
    skills: [],
  },
  ...CONTEXTUAL_AGENTS,
  ...SUB_AGENTS,
]
