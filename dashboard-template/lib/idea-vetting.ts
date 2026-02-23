// AI idea vetting — calls gateway to evaluate idea quality before saving

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

interface VetInput {
  title: string
  topic?: string
  researchNotes?: string
  ideaCategories?: string[]
  sourceUrl?: string
}

export interface VetResult {
  score: number
  reasoning: string
  evidence: string
}

export async function vetIdea(input: VetInput): Promise<VetResult> {
  const prompt = `You are an idea quality evaluator for a business with 3 brands:
- Business C: Education and consulting for B2B professionals ($1M+)
- Business A: Automation services for B2B companies ($1M+)
- Business B: SaaS builder tools for developers (any stage)

Evaluate this idea for relevance, market potential, and actionability.

Title: ${input.title}
${input.topic ? `Description: ${input.topic}` : ""}
${input.researchNotes ? `Research: ${input.researchNotes}` : ""}
${input.ideaCategories?.length ? `Categories: ${input.ideaCategories.join(", ")}` : ""}
${input.sourceUrl ? `Source: ${input.sourceUrl}` : ""}

Respond with ONLY valid JSON:
{"score": <1-10>, "reasoning": "<1-2 sentences>", "evidence": "<specific data points>"}`

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  })

  if (!res.ok) {
    console.error("Idea vetting gateway error:", res.status)
    return { score: 5, reasoning: "Vetting unavailable — default pass", evidence: "Gateway error" }
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ""

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON in response")
    const parsed = JSON.parse(match[0])
    return {
      score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
      reasoning: String(parsed.reasoning || "").slice(0, 500),
      evidence: String(parsed.evidence || "").slice(0, 500),
    }
  } catch {
    console.error("Idea vetting parse error:", text)
    return { score: 5, reasoning: "Vetting parse error — default pass", evidence: text.slice(0, 200) }
  }
}
