// Classify LinkedIn threads — auto-categorize + detect sellers via LLM

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getThreadById, getMessages, updateThread, getUnclassifiedThreadIds, getManualClassifications } from "@/lib/db-linkedin"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

const CLASSIFY_PROMPT = `You are a LinkedIn message classifier. Given a conversation and contact headline, return JSON only (no markdown):
{
  "category": "sales_inquiry" | "networking" | "job_opportunity" | "partnership" | "recruiter" | "spam" | "support" | "personal" | "other",
  "isSelling": true/false,
  "isPartner": true/false,
  "intent": "brief 1-sentence summary of what this person wants",
  "suggestedStatus": "needs-reply" | "waiting" | "archived"
}

CATEGORY rules:
- isSelling = true when the OTHER person is pitching/selling a product or service TO US (they want our money)
- isSelling includes: offering staff/engineers, agency services, SaaS tools, consulting, lead gen services, dev outsourcing, "pilot" offers, anything where THEY profit from US buying
- Flattery about our content followed by a pitch = isSelling true (common pattern: "loved your post" then selling)
- Recruiters with job opportunities are NOT selling — category "recruiter"
- Networking requests are NOT selling — category "networking"
- If someone is asking about OUR services/products, that's "sales_inquiry" (valuable lead)
- Cold outreach, tool demos, SaaS pitches, agency offers, staffing offers = isSelling true

PARTNER rules:
- isPartner = true for personal network contacts, friends, existing collaborators, non-business conversations
- isPartner = true for people we already work with or have an established relationship with
- isPartner = false for new contacts, cold messages, sales inquiries

STATUS rules (this is critical — threads must NOT stay in "unread"):
- "needs-reply" = we have read this thread but haven't responded yet, OR the last message is from THEM and we should reply. This is the most common status
- "waiting" = the last message is from US and we're waiting for their response
- "archived" = spam, pure sales pitches (isSelling=true), or dead conversations with no value
- NEVER return "qualified" — qualification is handled by WAMP scoring

Default to "needs-reply" if unsure. Only use "waiting" when WE sent the last message.

Return ONLY valid JSON, no explanation`

interface ClassifyResult {
  category: string
  isSelling: boolean
  isPartner: boolean
  intent: string
  suggestedStatus: string
}

async function classifyThread(threadId: string): Promise<ClassifyResult | null> {
  const thread = getThreadById(threadId)
  if (!thread) return null

  const msgs = getMessages(threadId)
  const recent = msgs.slice(-5)
  if (recent.length === 0) return null

  const convo = recent.map((m) => `[${m.direction}] ${m.senderName}: ${m.content}`).join("\n")
  const lastDir = recent[recent.length - 1]?.direction || "incoming"
  // Include past manual corrections as few-shot examples for AI learning
  const corrections = getManualClassifications(5)
  let examples = ""
  if (corrections.length > 0) {
    const lines = corrections.map((c) =>
      `- "${c.participantHeadline}" → category: ${c.category}${c.classificationNote ? ` (reason: ${c.classificationNote})` : ""}`
    ).join("\n")
    examples = `\n\nPrevious manual corrections (learn from these):\n${lines}\n`
  }

  const userContent = `Contact: ${thread.participantName}\nHeadline: ${thread.participantHeadline || "N/A"}\nLast message from: ${lastDir === "outgoing" ? "US" : "THEM"}\nTotal messages: ${msgs.length}\n\nConversation (last ${recent.length}):\n${convo}${examples}`

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "x-openclaw-agent-id": "main",
      "x-openclaw-session-key": "linkedin-classify",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: false,
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  })

  if (!res.ok) {
    console.error(`Classify gateway error ${res.status}:`, await res.text().catch(() => ""))
    return null
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ""

  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim()
    return JSON.parse(cleaned) as ClassifyResult
  } catch {
    console.error("Failed to parse classify response:", text.slice(0, 200))
    return null
  }
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json().catch(() => ({}))
    let threadIds: string[] = body.threadIds || []

    if (threadIds.length === 0) {
      threadIds = getUnclassifiedThreadIds()
    }

    const batch = threadIds.slice(0, 20)
    const results: Array<{ threadId: string; category: string; isSelling: boolean }> = []

    for (const threadId of batch) {
      const result = await classifyThread(threadId)
      if (!result) continue

      const now = new Date().toISOString()
      // Never set status to "qualified" — map to "needs-reply"
      const status = result.suggestedStatus === "qualified" ? "needs-reply" : result.suggestedStatus
      updateThread(threadId, {
        category: result.category as import("@/types").ThreadCategory,
        isSelling: result.isSelling,
        isPartner: result.isPartner || false,
        intent: result.intent,
        classifiedAt: now,
        status: status as import("@/types").ThreadStatus,
      })
      results.push({ threadId, category: result.category, isSelling: result.isSelling })
    }

    return NextResponse.json({ classified: results.length, results })
  })
}
