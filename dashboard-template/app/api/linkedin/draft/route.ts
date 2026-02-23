// Generate AI draft replies following the user's tone of voice + WAMP-driven assertiveness

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getThreadById, getMessages } from "@/lib/db-linkedin"
import { buildDraftPrompt } from "@/lib/draft-prompts"
import { saveDraftGeneration, getDraftHistory, markDraftUsed } from "@/lib/db-linkedin-drafts"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

function parseJson<T>(json: string | null | undefined): T | null {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { threadId, instruction } = body
    if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 })

    const thread = getThreadById(threadId)
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    const msgs = getMessages(threadId)
    const recent = msgs.slice(-15)
    const convo = recent.map((m) => `${m.senderName}: ${m.content}`).join("\n")
    const wampScore = thread.wampScore || 30
    const wampData = parseJson<{ band?: string; suggestedBusiness?: string | null }>(thread.qualificationData)
    const band = wampData?.band || "cool"
    const business = wampData?.suggestedBusiness || null

    const systemPrompt = buildDraftPrompt(wampScore, band, business)

    const enrichment = parseJson<Record<string, unknown>>(thread.enrichmentData)
    const posts = parseJson<unknown[]>(thread.postData)

    const userParts = [
      `Contact: ${thread.participantName}`,
      `Headline: ${thread.participantHeadline || "N/A"}`,
      `WAMP Score: ${wampScore}/100 (${band})`,
      `Category: ${thread.category || "unknown"}`,
      enrichment ? `\nEnrichment: ${JSON.stringify(enrichment).slice(0, 1000)}` : "",
      posts ? `\nRecent posts: ${JSON.stringify(posts).slice(0, 1500)}` : "",
      instruction ? `\nInstruction: ${instruction}` : "",
      `\nConversation:\n${convo}`,
    ].filter(Boolean).join("\n")

    const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        "x-openclaw-agent-id": "main",
        "x-openclaw-session-key": "linkedin-draft",
      },
      body: JSON.stringify({
        model: "openclaw:main",
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userParts },
        ],
      }),
    })

    if (!res.ok) {
      console.error(`Draft gateway error ${res.status}`)
      return NextResponse.json({ error: "Draft generation failed" }, { status: 502 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""

    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim()
      const result = JSON.parse(cleaned)
      const drafts: string[] = result.drafts || []
      const entry = saveDraftGeneration(threadId, instruction || "", drafts)
      return NextResponse.json({ drafts, draftHistoryId: entry.id })
    } catch {
      console.error("Failed to parse draft response:", text.slice(0, 300))
      const drafts = [text.trim()]
      const entry = saveDraftGeneration(threadId, instruction || "", drafts)
      return NextResponse.json({ drafts, draftHistoryId: entry.id })
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get("threadId")
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 })
  const history = getDraftHistory(threadId)
  return NextResponse.json({ history })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, variantIndex } = body
  if (!id || variantIndex === undefined) {
    return NextResponse.json({ error: "id and variantIndex required" }, { status: 400 })
  }
  markDraftUsed(id, variantIndex)
  return NextResponse.json({ ok: true })
}
