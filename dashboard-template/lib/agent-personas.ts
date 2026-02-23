// Agent-to-model routing and topic-to-agent defaults for auto-orchestration

import type { ChatTopic } from "@/types/index"

/** Maps agent ID to preferred model ID. Agents not listed use the gateway default. */
export const AGENT_MODEL_TIERS: Record<string, string> = {
  // Fast tier — lightweight coaching/utility agents
  "accountability-coach": "openai-codex/gpt-5.1-codex-mini",
  "productivity-coach": "openai-codex/gpt-5.1-codex-mini",
  "notion-engineer": "openai-codex/gpt-5.1-codex-mini",
  // GPT-5.2 tier — comms-heavy, multi-tool agents
  "chief-of-staff": "openai-codex/gpt-5.2",
  "sales-assistant": "openai-codex/gpt-5.2",
  "podcast-assistant": "openai-codex/gpt-5.2",
  "linkedin-specialist": "openai-codex/gpt-5.2",
  "instagram-specialist": "openai-codex/gpt-5.2",
  "community-specialist": "openai-codex/gpt-5.2",
  // Reasoning tier — deep analysis agents
  "content-creator": "google-gemini-cli/gemini-3-pro-preview",
  "research-analyst": "google-gemini-cli/gemini-3-pro-preview",
  "strategy-partner": "google-gemini-cli/gemini-3-pro-preview",
  "marketing-strategist": "google-gemini-cli/gemini-3-pro-preview",
  "product-specialist": "google-gemini-cli/gemini-3-pro-preview",
  "developer-liaison": "google-gemini-cli/gemini-3-pro-preview",
  "growth-strategist": "google-gemini-cli/gemini-3-pro-preview",
  "prompt-engineer": "google-gemini-cli/gemini-3-pro-preview",
  "reviewer-qa": "google-gemini-cli/gemini-3-pro-preview",
  "automation-architect": "google-gemini-cli/gemini-3-pro-preview",
}

/** Default agent for each non-general topic. General and coaching use LLM orchestrator. */
export const TOPIC_AGENT_DEFAULTS: Partial<Record<ChatTopic, string>> = {
  briefs: "chief-of-staff",
  reports: "research-analyst",
  research: "research-analyst",
  tasks: "chief-of-staff",
  // coaching: uses LLM orchestrator (multiple coaching agents)
  // system-improvement: no default agent (procedural/diagnostic, system prompt handles it)
  // memory: no default agent (system-level, no persona needed)
  // general: handled by LLM orchestrator (classify endpoint)
}

/** Default model for topics without an agent default. Overrides gateway default. */
export const TOPIC_MODEL_DEFAULTS: Partial<Record<ChatTopic, string>> = {
  "system-improvement": "openai-codex/gpt-5.3-codex",
}
