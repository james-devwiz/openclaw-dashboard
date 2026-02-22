import type { AgentDefinition } from "@/types/index"

// Example agents — customise these to match your AI's role definitions.
// Each agent appears on the Architecture page and can be assigned to businesses.
// Agents with a `systemPrompt` get context injected when @-mentioned in chat.
// Add more by following the same pattern.

export const CONTEXTUAL_AGENTS: AgentDefinition[] = [
  { id: "research-analyst", name: "Research Analyst", type: "contextual", description: "Research & insight — prospect research, competitive intel, analysis", businesses: ["business-1"], skills: ["oracle"], systemPrompt: "You are the Research Analyst. Search workspace memory first, then Slack/Teams, then web search. Save findings to workspace via POST /api/memory. Cite sources and distinguish facts from inference." },
  { id: "content-creator", name: "Content Creator", type: "contextual", description: "Content production — posts, emails, scripts, repurposing", businesses: ["business-1"], skills: ["slack", "notion"], systemPrompt: "You are the Content Creator. Check the content pipeline (GET /api/content) for items in progress. Generate documents using available skills. Save drafts via POST /api/content and update stages via PATCH as items progress." },
  { id: "strategy-partner", name: "Strategy Partner", type: "contextual", description: "Business/AI strategist — options, recommendations, plans", businesses: ["business-1"], skills: [], systemPrompt: "You are the Strategy Partner. Conduct deep analysis using multiple sources: workspace memory, web search, and meeting transcripts. Apply frameworks to synthesise insights. Save analysis to workspace and create actionable recommendations tied to specific goals." },
  // Add your own contextual agents here...
]

export const SUB_AGENTS: AgentDefinition[] = [
  { id: "reviewer-qa", name: "Reviewer / QA", type: "sub", description: "Quality control — reviews emails, docs, content before shipping", businesses: ["business-1", "personal"], skills: [] },
  // Add your own sub-agents here...
]

/** Returns a map of agentId → systemPrompt for agents that have one */
export function getAgentSystemPrompts(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const agent of [...CONTEXTUAL_AGENTS, ...SUB_AGENTS]) {
    if (agent.systemPrompt) map[agent.id] = agent.systemPrompt
  }
  return map
}
