import { NextRequest } from "next/server"

import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "@/lib/architecture-agents"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""
const CLASSIFY_MODEL = "openai-codex/gpt-5.1-codex-mini"

const ALL_AGENTS = [...CONTEXTUAL_AGENTS, ...SUB_AGENTS]
const AGENT_LIST = ALL_AGENTS.map((a) => `- ${a.id}: ${a.description}`).join("\n")

const CLASSIFY_PROMPT = `You route user messages to the best agent. Pick ONE agent ID from this list:

${AGENT_LIST}

Rules:
- Reply with ONLY the agent ID (e.g. "research-analyst"), nothing else
- If unsure, reply "main"
- For general chitchat or unclear intent, reply "main"`

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return Response.json({ agentId: "main", agentName: "AI Assistant" })

    const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        "x-openclaw-agent-id": "main",
        "x-openclaw-session-key": "classify-ephemeral",
      },
      body: JSON.stringify({
        model: CLASSIFY_MODEL,
        stream: false,
        max_tokens: 30,
        messages: [
          { role: "system", content: CLASSIFY_PROMPT },
          { role: "user", content: message },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return Response.json({ agentId: "main", agentName: "AI Assistant" })

    const data = await res.json()
    const raw = (data.choices?.[0]?.message?.content || "").trim().toLowerCase()
    const agent = ALL_AGENTS.find((a) => a.id === raw)

    return Response.json({
      agentId: agent?.id || "main",
      agentName: agent?.name || "AI Assistant",
    })
  } catch (error) {
    console.error("Chat classify failed:", error)
    return Response.json({ agentId: "main", agentName: "AI Assistant" })
  }
}
