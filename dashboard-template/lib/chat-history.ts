import { apiFetch } from "@/lib/api-client"
import { TOPIC_SYSTEM_PROMPTS, RESEARCH_MODE_PROMPTS } from "@/lib/chat-prompts"
import { getAgentSystemPrompts, getAgentNameMap } from "@/lib/architecture-agents"
import { TOPIC_AGENT_DEFAULTS, AGENT_MODEL_TIERS } from "@/lib/agent-personas"
import type { ChatMessage, ChatTopic, ChatAttachment } from "@/types/index"
import type { ResearchMode } from "@/components/chat/ResearchModeButtons"

export type SessionMessages = Record<string, ChatMessage[]>

export function parseAttachments(json: string): ChatAttachment[] | undefined {
  if (!json) return undefined
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    return parsed.map((a: { name: string; type: string }) => ({ name: a.name, type: a.type, dataUrl: "" }))
  } catch { return undefined }
}

const PLAN_MODE_PROMPT = `You are in Plan Mode. Before taking any actions, creating tasks, or executing work:
1. Ask 3-5 clarifying questions covering: scope, timeline, dependencies, acceptance criteria, and risks
2. Wait for the user to answer ALL questions before proceeding
3. Present a numbered step-by-step plan with: clear deliverables, estimated effort per step, and success criteria
4. Ask "Shall I proceed with this plan?" and wait for explicit approval (e.g. "yes", "go ahead", "approved")
5. Only after approval, execute the plan or emit task markers

NEVER skip straight to execution or task creation. NEVER emit ---task markers without completing steps 1-4.
If the user gives a vague request, ask for specifics rather than guessing.`

const MENTION_RE = /@([a-z][a-z0-9-]+)/g

export function hasMentions(text: string): boolean {
  MENTION_RE.lastIndex = 0
  return MENTION_RE.test(text)
}

/** Build the message history array including system prompts, agent prompts, and conversation. */
export function buildHistory(
  messages: ChatMessage[],
  planMode: boolean,
  topicPrompt?: string,
  latestUserContent?: string,
  autoAgentId?: string,
): { role: string; content: string }[] {
  const history: { role: string; content: string }[] = []
  if (topicPrompt) {
    // Inject active brief context so AI can use :::brief-update markers
    const lastBrief = [...messages].reverse().find(m => m.metadata?.briefId)
    if (lastBrief?.metadata) {
      topicPrompt += `\n\nActive brief in this session: ID="${lastBrief.metadata.briefId}", type="${lastBrief.metadata.briefType}". To update it, use :::brief-update with this ID.`
    }
    history.push({ role: "system", content: topicPrompt })
  }
  if (planMode) {
    history.push({ role: "system", content: PLAN_MODE_PROMPT })
  }
  const agentPrompts = getAgentSystemPrompts()
  const injected = new Set<string>()
  // Inject agent system prompts for @-mentions in the latest user message
  if (latestUserContent) {
    let match: RegExpExecArray | null
    MENTION_RE.lastIndex = 0
    while ((match = MENTION_RE.exec(latestUserContent)) !== null) {
      const agentId = match[1]
      if (!injected.has(agentId) && agentPrompts[agentId]) {
        history.push({ role: "system", content: agentPrompts[agentId] })
        injected.add(agentId)
      }
    }
  }
  // Auto-inject agent prompt from topic default or orchestrator (only if no @mention)
  if (autoAgentId && !injected.size && agentPrompts[autoAgentId]) {
    history.push({ role: "system", content: agentPrompts[autoAgentId] })
  }
  const filtered = messages
    .filter((m) => m.status !== "error" && m.content.trim())
    .slice(-200)
  for (const m of filtered) {
    history.push({ role: m.role, content: m.content })
  }
  return history
}

export type ResolvedAgent = {
  agentId?: string
  agentName?: string
  model?: string
}

/** Resolve which agent and model to use: @mention > topic default > LLM orchestrator. */
export async function resolveAgent(
  content: string,
  topic: ChatTopic,
  selectedModel: string | null,
  signal?: AbortSignal,
): Promise<ResolvedAgent> {
  const mentionFound = hasMentions(content)
  let resolvedAgentId: string | undefined
  let resolvedAgentName: string | undefined

  if (!mentionFound) {
    const topicDefault = TOPIC_AGENT_DEFAULTS[topic]
    if (topicDefault) {
      resolvedAgentId = topicDefault
      resolvedAgentName = getAgentNameMap()[topicDefault]
    } else if (topic === "general") {
      try {
        const classifyRes = await apiFetch("/api/chat/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
          signal,
        })
        if (classifyRes.ok) {
          const classified = await classifyRes.json()
          if (classified.agentId && classified.agentId !== "main") {
            resolvedAgentId = classified.agentId
            resolvedAgentName = classified.agentName
          }
        }
      } catch { /* classification failed, proceed without agent */ }
    }
  }

  const resolvedModel = selectedModel || (resolvedAgentId ? AGENT_MODEL_TIERS[resolvedAgentId] : undefined)
  return { agentId: resolvedAgentId, agentName: resolvedAgentName, model: resolvedModel }
}

/** Build the topic system prompt with optional research mode. */
export function buildTopicPrompt(topic: ChatTopic, researchMode: ResearchMode): string {
  let prompt = TOPIC_SYSTEM_PROMPTS[topic]
  if (researchMode) {
    prompt += "\n\n" + RESEARCH_MODE_PROMPTS[researchMode]
  }
  return prompt
}

type StreamCallbacks = {
  onContent: (accumulated: string) => void
  onMeta: (meta: Record<string, unknown>) => void
}

/** Read an SSE response stream and dispatch content/meta events. */
export async function processSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamCallbacks,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulated = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data: ")) continue
      const data = trimmed.slice(6)
      if (data === "[DONE]") continue
      try {
        const parsed = JSON.parse(data)
        if (parsed.content) {
          accumulated += parsed.content
          callbacks.onContent(accumulated)
        } else if (parsed.meta) {
          callbacks.onMeta(parsed.meta)
        }
      } catch {
        // skip malformed
      }
    }
  }
}
