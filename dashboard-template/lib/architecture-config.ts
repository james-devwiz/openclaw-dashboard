import type { AgentDefinition, BusinessDefinition } from "@/types/index"
import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "./architecture-agents"

export const BUSINESSES: BusinessDefinition[] = [
  { id: "business-a", name: "Agency", description: "AI automations agency specialising in sales automations", colour: "#3b82f6" },
  { id: "business-b", name: "SaaS Company", description: "Software development — web apps, mobile apps, AI functionality", colour: "#8b5cf6" },
  { id: "business-c", name: "Consulting Firm", description: "Coaching ecosystem — community, podcast, premium coaching", colour: "#f59e0b" },
  { id: "personal", name: "Personal", description: "Personal tasks and projects", colour: "#10b981" },
]

export const AGENTS: AgentDefinition[] = [
  {
    id: "main",
    name: "AI Assistant",
    type: "main",
    description: "AI Chief of Staff — orchestrates all agents across all domains",
    businesses: ["business-a", "business-b", "business-c", "personal"],
    skills: [],
  },
  ...CONTEXTUAL_AGENTS,
  ...SUB_AGENTS,
]
