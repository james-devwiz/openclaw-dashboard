import type { ChatTopic } from "@/types/index"
import type { BriefType } from "@/types/brief.types"
import type { TaskPriority, TaskCategory } from "@/types/index"
import { SITE_CONFIG } from "@/lib/site-config"

// --- Topic system prompts ---

const BRIEF_SYSTEM_PROMPT = `You generate briefs and summaries. When generating a brief:
1. Write a SHORT conversational confirmation (1-2 sentences) FIRST
2. Then wrap the full brief content in :::brief / :::end markers at the END of your response

Format:
Your conversational response here (e.g. "Here's your Morning Brief for today.")

:::brief
type: <BriefType>
title: <descriptive title with date>
date: <YYYY-MM-DD>

# Full Brief Content Here
...structured markdown...
:::end

Valid types: Morning Brief, End of Day Report, Pre-Meeting Brief, Post-Meeting Report, Weekly Review, Business Analysis, Cost Report, Custom.

IMPORTANT:
- NEVER put the full brief content in the chat text — only the short confirmation
- The title should be descriptive (e.g. "Morning Brief - February 15, 2026")
- Always include the date field
- Pull from calendar, Slack, email, and tasks as needed

When UPDATING an existing brief (the user asks to modify/change/add to it):
1. Write a SHORT conversational confirmation FIRST
2. Use :::brief-update markers with the brief ID

:::brief-update
id: <briefId from context>

# Full Updated Brief Content
...complete updated markdown...
:::end`

const REPORT_SYSTEM_PROMPT = `You generate reports and analysis. When generating a report:
1. Write a SHORT conversational confirmation (1-2 sentences) FIRST
2. Then wrap the full report content in :::brief / :::end markers at the END of your response

Format:
Your conversational response here (e.g. "I've prepared your End of Day Report.")

:::brief
type: <BriefType>
title: <descriptive title with date>
date: <YYYY-MM-DD>

# Full Report Content Here
...data-driven sections with metrics and insights...
:::end

Valid types: Morning Brief, End of Day Report, Pre-Meeting Brief, Post-Meeting Report, Weekly Review, Business Analysis, Cost Report, Custom.

IMPORTANT:
- NEVER put the full report content in the chat text — only the short confirmation
- The title should be descriptive (e.g. "End of Day Report - February 15, 2026")
- Always include the date field

When UPDATING an existing report (the user asks to modify/change/add to it):
1. Write a SHORT conversational confirmation FIRST
2. Use :::brief-update markers with the brief ID

:::brief-update
id: <briefId from context>

# Full Updated Report Content
...complete updated markdown...
:::end`

export const TOPIC_SYSTEM_PROMPTS: Record<ChatTopic, string> = {
  general:
    `You are ${SITE_CONFIG.aiName}, the user's personal AI assistant in the ${SITE_CONFIG.dashboardTitle}. You have access to all connected tools and integrations. Check PLAYBOOK.md for the right tool chain for each scenario. Be concise and actionable.`,
  briefs: BRIEF_SYSTEM_PROMPT,
  reports: REPORT_SYSTEM_PROMPT,
  research:
    "You conduct multi-source research. Check workspace memory first (GET /api/memory?q=query), then search connected communication channels, meeting transcripts, and web search. Synthesise findings with structured sections and source references. Save results to workspace via POST /api/memory (action: create, relativePath: research/<slug>.md). Distinguish facts from analysis.",
  tasks:
    `You manage tasks and goals in the ${SITE_CONFIG.dashboardTitle}. Scheduling pipeline: Backlog → To Be Scheduled → To Do This Week → In Progress → Needs Review → Completed. Every task needs a goalId (use "general" if none fits), complexity (Simple/Moderate/Complex), and estimatedMinutes. Use POST /api/tasks/pickup to start work, POST /api/tasks/schedule for daily scheduling, GET /api/tasks/work for overnight context. When suggesting new tasks, use \`---task\\nname: <name>\\npriority: <H/M/L>\\ncategory: <${SITE_CONFIG.taskCategories.join("|")}>\\n---\` markers.`,
  "self-improvement":
    "You reflect on AI capabilities and workspace optimization. Use GET /api/heartbeats?stats=true for heartbeat performance, GET /api/activity?limit=50 for recent action history, GET /api/cron for cron job status, and GET /api/health for system health. Analyse patterns, identify failures or inefficiencies, and suggest actionable improvements to prompts, cron jobs, tool usage, and configurations.",
  memory:
    "You manage the persistent memory system with 7 categories: Core, Business, Orchestration, Memory, Research, Projects, and Other. Use GET /api/memory?counts=true for category overview, GET /api/memory?category=<cat> to browse, GET /api/memory?q=<query> to search. Edit files via PUT /api/memory/<id> (base64url-encoded path, auto-commits to git). Create/append via POST /api/memory. Check staleness (30d/60d thresholds) and cross-references.",
}

// --- Research mode augmentations ---

export const RESEARCH_MODE_PROMPTS: Record<"search" | "deep", string> = {
  search:
    "Use web search to find current information. Provide a concise summary of findings with source URLs. Focus on the most relevant and recent results.",
  deep:
    "Conduct comprehensive multi-query research. Synthesize findings from multiple sources into a thorough analysis. Include source URLs, compare viewpoints, and highlight key insights.",
}

// --- Metadata parsers ---

const TASK_META_RE = /---task\n([\s\S]*?)\n---/g

// New brief block markers
const BRIEF_BLOCK_RE = /:::brief\n([\s\S]*?):::end/
const BRIEF_UPDATE_BLOCK_RE = /:::brief-update\n([\s\S]*?):::end/

export interface BriefBlockMeta {
  type: BriefType
  title: string
  date: string
  content: string
}

export interface BriefUpdateMeta {
  id: string
  content: string
}

export interface TaskMeta {
  name: string
  priority: TaskPriority
  category: TaskCategory
}

const VALID_BRIEF_TYPES = new Set([
  "Morning Brief", "End of Day Report", "Pre-Meeting Brief",
  "Post-Meeting Report", "Weekly Review", "Business Analysis", "Cost Report", "Custom",
])

const PRIORITY_MAP: Record<string, TaskPriority> = { H: "High", M: "Medium", L: "Low" }
const VALID_CATEGORIES = new Set<string>(SITE_CONFIG.taskCategories)

function parseKeyValueHeader(text: string): { fields: Record<string, string>; body: string } {
  const lines = text.split("\n")
  const fields: Record<string, string> = {}
  let bodyStart = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") {
      bodyStart = i + 1
      break
    }
    const idx = line.indexOf(":")
    if (idx > 0) {
      fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
    bodyStart = i + 1
  }

  return { fields, body: lines.slice(bodyStart).join("\n").trim() }
}

export function parseBriefBlock(text: string): BriefBlockMeta | null {
  const match = BRIEF_BLOCK_RE.exec(text)
  if (!match) return null

  const { fields, body } = parseKeyValueHeader(match[1])

  const type = fields.type as BriefType
  const title = fields.title
  const date = fields.date
  if (!type || !title || !date) return null
  if (!VALID_BRIEF_TYPES.has(type)) return null

  return { type, title, date, content: body }
}

export function parseBriefUpdateBlock(text: string): BriefUpdateMeta | null {
  const match = BRIEF_UPDATE_BLOCK_RE.exec(text)
  if (!match) return null

  const { fields, body } = parseKeyValueHeader(match[1])

  const id = fields.id
  if (!id) return null

  return { id, content: body }
}

export function parseTaskMarkers(text: string): TaskMeta[] {
  const tasks: TaskMeta[] = []
  let match: RegExpExecArray | null
  while ((match = TASK_META_RE.exec(text)) !== null) {
    const fields: Record<string, string> = {}
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":")
      if (idx > 0) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
    const name = fields.name
    const priority = PRIORITY_MAP[fields.priority] || "Medium"
    const category = VALID_CATEGORIES.has(fields.category) ? fields.category as TaskCategory : "Personal"
    if (name) tasks.push({ name, priority, category })
  }
  return tasks
}

export function stripMetaBlocks(text: string): string {
  let result = text
    // Strip complete :::brief-update...:::end blocks (check first — more specific)
    .replace(/:::brief-update\n[\s\S]*?:::end/g, "")
    // Strip complete :::brief...:::end blocks
    .replace(/:::brief\n[\s\S]*?:::end/g, "")
    // Strip task markers
    .replace(TASK_META_RE, "")

  // Handle partial matches during streaming (marker started but no :::end yet)
  const partialBriefUpdate = result.indexOf(":::brief-update")
  if (partialBriefUpdate !== -1) {
    result = result.slice(0, partialBriefUpdate)
  } else {
    const partialBrief = result.indexOf(":::brief")
    if (partialBrief !== -1) {
      result = result.slice(0, partialBrief)
    }
  }

  return result.replace(/\n{3,}$/g, "\n").replace(/^\n+/, "")
}
