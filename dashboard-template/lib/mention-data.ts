// Static mention definitions for @ autocomplete

import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "@/lib/architecture-agents"

import type { MentionItem, MentionCategory } from "@/types/chat.types"

function items(category: MentionCategory, entries: [string, string][]): MentionItem[] {
  return entries.map(([id, description]) => ({
    id,
    label: `@${id}`,
    category,
    description,
  }))
}

const AGENTS: MentionItem[] = CONTEXTUAL_AGENTS.map((a) => ({
  id: a.id,
  label: `@${a.id}`,
  category: "Agents" as MentionCategory,
  description: a.description,
}))

const SUB_AGENT_ITEMS: MentionItem[] = SUB_AGENTS.map((a) => ({
  id: a.id,
  label: `@${a.id}`,
  category: "Sub-Agents" as MentionCategory,
  description: a.description,
}))

const SKILLS = items("Skills", [
  ["notion", "Notion workspace integration"],
  ["github", "GitHub repos & issues"],
  ["slack", "Slack messaging"],
  ["gog", "Google Workspace (Calendar, Gmail, Drive)"],
  ["himalaya", "Email client"],
  ["weather", "Weather forecasts"],
  ["coding-agent", "Code generation & analysis"],
  ["spotify", "Music & playlists"],
  ["nano-pdf", "PDF processing"],
  ["gemini", "Google Gemini model"],
  ["obsidian", "Obsidian notes vault"],
  ["oracle", "Oracle database queries"],
  ["1password", "1Password secrets"],
  ["bird", "Twitter/X integration"],
  ["clawhub", "OpenClaw plugin hub"],
  ["gifgrep", "GIF search"],
  ["healthcheck", "System health monitoring"],
  ["mcporter", "MCP server tools"],
  ["openhue", "Philips Hue smart lights"],
  ["openai-whisper", "Audio transcription"],
  ["ordercli", "Order management CLI"],
  ["session-logs", "Session log viewer"],
  ["skill-creator", "Create new skills"],
  ["songsee", "Song recognition"],
  ["tmux", "Terminal multiplexer"],
  ["video-frames", "Video frame extraction"],
  ["wacli", "WhatsApp CLI"],
])

const CONTEXT = items("Context", [
  ["memory", "Persistent memory & facts"],
  ["identity", "AI identity configuration"],
  ["soul", "Core personality & values"],
  ["user", "User profile & preferences"],
  ["tools", "Available tools reference"],
  ["heartbeat", "Heartbeat schedule & config"],
  ["boot", "Boot sequence & startup"],
])

const MODELS = items("Models", [
  ["gpt", "OpenAI GPT model"],
  ["sonnet", "Claude Sonnet model"],
  ["opus", "Claude Opus model"],
])

const SYSTEM = items("System", [
  ["cron", "Cron job management"],
  ["health", "System health status"],
  ["tasks", "Task management"],
  ["goals", "Goal tracking"],
])

export const MENTION_ITEMS: MentionItem[] = [
  ...AGENTS, ...SUB_AGENT_ITEMS, ...SKILLS, ...CONTEXT, ...MODELS, ...SYSTEM,
]

export function filterMentions(query: string): MentionItem[] {
  if (!query) return MENTION_ITEMS.slice(0, 12)
  const lower = query.toLowerCase()
  return MENTION_ITEMS.filter(
    (item) =>
      item.id.toLowerCase().includes(lower) ||
      item.label.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower),
  )
}
