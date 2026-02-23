// WAMP v2 scoring — 3-layer, 0-100 lead warmth assessment

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getThreadById, getMessages, updateThread } from "@/lib/db-linkedin"
import { enrichPerson, enrichOrganization, isApolloConfigured } from "@/lib/apollo"
import { WAMP_V2_PROMPT, buildScoringContext } from "@/lib/wamp-v2-prompt"
import { saveScoreHistory, getScoreHistory } from "@/lib/db-linkedin-scores"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get("threadId")
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 })
  const history = getScoreHistory(threadId)
  return NextResponse.json({ history })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { threadId } = body
    if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 })

    const thread = getThreadById(threadId)
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    const msgs = getMessages(threadId)

    // Build enrichment context
    let enrichmentSummary = ""
    if (thread.enrichmentData) {
      try {
        const ed = JSON.parse(thread.enrichmentData)
        const p = ed.person
        const o = ed.organization
        const parts: string[] = []
        if (p?.title) parts.push(`Title: ${p.title}`)
        if (o?.name) parts.push(`Company: ${o.name}`)
        if (o?.industry) parts.push(`Industry: ${o.industry}`)
        if (o?.estimated_num_employees) parts.push(`Employees: ${o.estimated_num_employees}`)
        if (o?.annual_revenue) parts.push(`Revenue: $${(o.annual_revenue / 1e6).toFixed(1)}M`)
        enrichmentSummary = parts.join(", ")
      } catch { /* skip */ }
    }

    // Build posts context — auto-fetch if not cached
    let postsSummary = ""
    if (!thread.postData) {
      try {
        const { getUnipile, getAccountId, isUnipileConfigured } = await import("@/lib/unipile")
        if (isUnipileConfigured()) {
          let identifier = thread.participantId
          if (!identifier && thread.participantProfileUrl) {
            const match = thread.participantProfileUrl.match(/\/in\/([^/?]+)/)
            if (match) identifier = match[1]
          }
          if (identifier) {
            const client = getUnipile()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resp: any = await client.users.getAllPosts({ account_id: getAccountId(), identifier, limit: 20 })
            const posts = resp?.items || []
            if (posts.length > 0) {
              updateThread(threadId, { postData: JSON.stringify(posts) })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              postsSummary = posts.slice(0, 10).map((p: any) => `- ${String(p.text || "").slice(0, 200)}`).join("\n")
            }
          }
        }
      } catch { /* posts are optional */ }
    } else {
      try {
        const posts = JSON.parse(thread.postData)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        postsSummary = posts.slice(0, 10).map((p: any) => `- ${String(p.text || "").slice(0, 200)}`).join("\n")
      } catch { /* skip */ }
    }

    // Build conversation context
    const recent = msgs.slice(-15)
    const convo = recent.map((m) => `[${m.direction}] ${m.senderName}: ${m.content}`).join("\n")

    const userContent = buildScoringContext({
      name: thread.participantName,
      headline: thread.participantHeadline,
      isSelling: thread.isSelling,
      category: thread.category,
      enrichment: enrichmentSummary,
      posts: postsSummary,
      conversation: convo,
      messageCount: msgs.length,
    })

    const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        "x-openclaw-agent-id": "main",
        "x-openclaw-session-key": "linkedin-score",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: false,
        messages: [
          { role: "system", content: WAMP_V2_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    })

    if (!res.ok) {
      console.error(`Score gateway error ${res.status}`)
      return NextResponse.json({ error: "Scoring failed" }, { status: 502 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""

    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim()
      const result = JSON.parse(cleaned)

      const isQualified = result.total >= 61
      updateThread(threadId, {
        wampScore: result.total,
        qualificationData: JSON.stringify(result),
        isQualified,
      })

      // Save to score history
      saveScoreHistory(threadId, result)

      // Auto-enrich qualified leads if not already enriched
      if (isQualified && !thread.enrichmentData && isApolloConfigured()) {
        autoEnrich(threadId, thread.participantProfileUrl).catch(() => {})
      }

      return NextResponse.json(result)
    } catch {
      console.error("Failed to parse score response:", text.slice(0, 200))
      return NextResponse.json({ error: "Invalid score response" }, { status: 502 })
    }
  })
}

async function autoEnrich(threadId: string, profileUrl: string) {
  if (!profileUrl) return
  try {
    const person = await enrichPerson({ linkedinUrl: profileUrl })
    let org = null
    if (person?.organization?.website_url) {
      const domain = new URL(person.organization.website_url).hostname
      org = await enrichOrganization(domain)
    }
    updateThread(threadId, { enrichmentData: JSON.stringify({ person, organization: org }) })
  } catch (err) {
    console.error("Auto-enrich failed:", err)
  }
}
