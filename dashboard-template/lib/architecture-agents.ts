import type { AgentDefinition } from "@/types/index"

// Example agents — customise these to match your AI's role definitions.
// Each agent appears on the Architecture page and can be assigned to businesses.
// Add more by following the same pattern.

export const CONTEXTUAL_AGENTS: AgentDefinition[] = [
  { id: "research-analyst", name: "Research Analyst", type: "contextual", description: "Research & insight — prospect research, competitive intel, analysis", businesses: ["business-1"], skills: ["oracle"] },
  { id: "content-creator", name: "Content Creator", type: "contextual", description: "Content production — posts, emails, scripts, repurposing", businesses: ["business-1"], skills: ["slack", "notion"] },
  { id: "strategy-partner", name: "Strategy Partner", type: "contextual", description: "Business/AI strategist — options, recommendations, plans", businesses: ["business-1"], skills: [] },
  // Add your own contextual agents here...
]

export const SUB_AGENTS: AgentDefinition[] = [
  { id: "reviewer-qa", name: "Reviewer / QA", type: "sub", description: "Quality control — reviews emails, docs, content before shipping", businesses: ["business-1", "personal"], skills: [] },
  // Add your own sub-agents here...
]
