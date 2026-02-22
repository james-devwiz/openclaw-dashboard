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
  ["notion", "Read/write Notion pages and databases"],
  ["github", "Manage repos, PRs, issues, and code review"],
  ["slack", "Send messages via Slack bot integration"],
  ["gog", "Google Calendar, Gmail, Drive (OAuth2)"],
  ["himalaya", "Read/send email via IMAP/SMTP"],
  ["weather", "Weather forecasts for your location"],
  ["coding-agent", "Code generation, analysis, and refactoring"],
  ["spotify", "Music playback and playlist management"],
  ["nano-pdf", "Quick PDF text extraction (bundled)"],
  ["gemini", "Google Gemini model for generation"],
  ["obsidian", "Read/write Obsidian vault notes"],
  ["oracle", "Perplexity-powered web research"],
  ["1password", "Retrieve secrets from 1Password"],
  ["bird", "Twitter/X post and search"],
  ["clawhub", "Browse and install OpenClaw plugins"],
  ["gifgrep", "Search and send GIFs"],
  ["healthcheck", "Run system health diagnostics"],
  ["mcporter", "Manage MCP server connections"],
  ["openhue", "Control Philips Hue smart lights"],
  ["openai-whisper", "Transcribe audio files to text"],
  ["ordercli", "Order management operations"],
  ["session-logs", "View and search gateway session logs"],
  ["skill-creator", "Scaffold and build new OpenClaw skills"],
  ["songsee", "Identify songs from audio"],
  ["tmux", "Manage terminal multiplexer sessions"],
  ["video-frames", "Extract frames from video files"],
  ["wacli", "Send/read WhatsApp messages"],
])

const CONTEXT = items("Context", [
  ["memory", "Search and browse workspace files (7 categories)"],
  ["identity", "AI identity — name, role, purpose"],
  ["soul", "Communication style, personality, values"],
  ["user", "User profile, businesses, preferences"],
  ["tools", "Connected services, CLI tools, API reference"],
  ["heartbeat", "Periodic checklist and schedule"],
  ["boot", "Startup sequence and initialization order"],
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
