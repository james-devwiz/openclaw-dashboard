// AI-powered approval revision — sends user feedback to gateway for proposal revision

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

interface RevisionInput {
  title: string
  context: string
  category: string
  feedback: string
}

interface RevisionResult {
  title: string
  context: string
}

export async function reviseApprovalWithAI(input: RevisionInput): Promise<RevisionResult> {
  const prompt = `You are reviewing a proposed action that needs revision based on the user's feedback.

Original proposal title: ${input.title}
Category: ${input.category}

Original proposal:
${input.context}

User feedback:
${input.feedback}

Revise the proposal incorporating the user's feedback. Keep the same general structure and format as the original proposal. Only change what the feedback asks for.

Respond with ONLY valid JSON (no markdown fences):
{"title": "<revised title>", "context": "<revised proposal text>"}`

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      model: "openai-codex/gpt-5.1-codex-mini",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  })

  if (!res.ok) {
    throw new Error(`Gateway error: ${res.status}`)
  }

  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content || ""

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON in AI response")

  const parsed = JSON.parse(match[0])
  return {
    title: String(parsed.title || input.title).slice(0, 500),
    context: String(parsed.context || input.context).slice(0, 5000),
  }
}
