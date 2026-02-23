// AI source validation — calls gateway to evaluate idea source quality

import type { IdeaSourcePlatform, IdeaSourceValidation } from "@/types"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

interface ValidateInput {
  platform: IdeaSourcePlatform
  url: string
  comments?: string
}

export async function validateSource(input: ValidateInput): Promise<IdeaSourceValidation> {
  const prompt = `You are evaluating an idea source for a business with 3 brands:
- Business C: Education and consulting for B2B professionals ($1M+)
- Business A: Automation services for B2B companies ($1M+)
- Business B: SaaS builder tools for developers (any stage)

Evaluate this source for scanning potential.

Platform: ${input.platform}
URL: ${input.url}
${input.comments ? `User notes: ${input.comments}` : ""}

Assess:
1. Is the URL valid and likely to have scannable content?
2. How relevant is this source to our 3 businesses?
3. What specific content/ideas could we extract? (trends, competitor intel, content inspiration, business opportunities)
4. How frequently should we scan it?

Respond with ONLY valid JSON:
{"score": <1-10>, "summary": "<1 sentence assessment>", "details": "<relevance analysis, 2-3 sentences>", "extractionPlan": "<what the scanner will look for, 2-3 sentences>"}`

  try {
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
      console.error("Source validation gateway error:", res.status)
      return { score: 5, summary: "Validation unavailable — default pass", details: "Gateway error", extractionPlan: "Standard content scan" }
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON in response")

    const parsed = JSON.parse(match[0])
    return {
      score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
      summary: String(parsed.summary || "").slice(0, 300),
      details: String(parsed.details || "").slice(0, 500),
      extractionPlan: String(parsed.extractionPlan || "").slice(0, 500),
    }
  } catch (err) {
    console.error("Source validation error:", err)
    return { score: 5, summary: "Validation error — default pass", details: "Could not validate", extractionPlan: "Standard content scan" }
  }
}
