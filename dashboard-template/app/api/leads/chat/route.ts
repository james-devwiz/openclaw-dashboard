import { NextRequest } from "next/server"
import { saveChatMessage } from "@/lib/db-chat"
import { getLeadStats, getLeads } from "@/lib/db-leads"
import { getICPPrompt } from "@/lib/lead-icp"
import { getOutreachPrompt } from "@/lib/lead-outreach"
import { createSmartStream } from "@/lib/chat-stream"

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history, model } = await req.json()

    if (!message) {
      return new Response(JSON.stringify({ error: "Message required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      })
    }

    const sid = sessionId || "default"
    saveChatMessage({ topic: "leads", sessionId: sid, role: "user", content: message })

    // Build lead context
    const stats = getLeadStats()
    const recentLeads = getLeads({ limit: 20 })
    const leadSummary = recentLeads.map((l) =>
      `- ${l.companyName} (${l.status}, score:${l.score}) ${l.contactName ? `— ${l.contactName}` : ""}`
    ).join("\n")

    const systemPrompt = `You are a B2B Lead Generation & Cold Outreach Strategist.

## Ideal Customer Profiles
${getICPPrompt()}

${getOutreachPrompt()}

## Communication Style
ALL outreach copy (emails, LinkedIn messages, scripts) MUST follow these rules:
- Write in the user's voice: simple, warm, conversational, 3rd-grade reading level
- Short punchy sentences — under 10 words each
- Informal but professional
- No jargon, no corporate language — sounds like talking to a friend
- NEVER use AI-detectable words: delve, landscape, realm, journey, tapestry, moreover, furthermore, however, additionally, comprehensive, robust, leverage, facilitate, streamline
- Vary structure — use fragments, contractions, casual transitions
- Plain text only — no HTML formatting in emails

## Current Pipeline
- Total leads: ${stats.total}
- Qualified (ready to outreach): ${stats.qualified}
- Hot leads (score 80+): ${stats.hotLeads}
- Contacted this week: ${stats.contactedThisWeek}
- Average score: ${stats.avgScore}

## Recent Leads
${leadSummary || "No leads yet."}

## Your Capabilities
- Initiate one-off campaigns with specific targeting criteria
- Discuss targeting strategy and ICP refinement
- Help qualify and prioritise leads
- Generate personalised outreach copy (email sequences, LinkedIn messages)
- Suggest talking points for phone calls
- Analyse lead quality and pipeline health
- Report on existing campaigns and lead status

Keep responses concise and actionable. Write outreach copy in the user's voice — warm, simple, direct.`

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ]

    const sessionKey = `command-centre-leads-${sid}`

    return await createSmartStream({
      messages,
      sessionKey,
      model,
      onComplete: (fullResponse) => {
        saveChatMessage({ topic: "leads", sessionId: sid, role: "assistant", content: fullResponse })
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: `Lead chat error: ${msg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
