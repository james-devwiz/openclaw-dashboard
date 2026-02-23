// LinkedIn invitation processor — fetch, classify, accept/decline, welcome sequence

import { getUnipile, getAccountId, isUnipileConfigured } from "./unipile"
import { getICPPrompt } from "./lead-icp"
import { upsertThread } from "./db-linkedin"
import { getProcessedInvitationIds, recordInvitation, updateInvitationThread } from "./db-linkedin-invitations"
import { logActivity } from "./activity-logger"

import type { InvitationDecision } from "@/types"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""
const MAX_PER_RUN = 15

const ALLOWED_COUNTRIES = new Set([
  "united states", "usa", "us", "canada", "ca", "united kingdom", "uk", "gb",
  "australia", "au", "new zealand", "nz", "singapore", "sg",
  "france", "fr", "germany", "de", "netherlands", "nl",
])

const WELCOME_MESSAGES = [
  (name: string) => `Hey ${name} - thanks so much for the follow.`,
  () => "Was it the content that resonated?",
  () => "Or are you looking for help to grow your business with AI?",
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RawInvitation { id: string; sender?: any; message?: string }

interface ClassifyResult {
  accept: boolean; reason: string; isFounder: boolean
  isSpam: boolean; icpMatch: string; confidence: number
}

export function isAllowedCountry(location?: string, locale?: string): boolean {
  if (locale) {
    const code = locale.toLowerCase().split(/[-_]/).pop() || ""
    if (ALLOWED_COUNTRIES.has(code)) return true
  }
  if (location) {
    const lower = location.toLowerCase()
    for (const country of ALLOWED_COUNTRIES) {
      if (lower.includes(country)) return true
    }
  }
  return false
}

async function fetchReceivedInvitations(): Promise<RawInvitation[]> {
  const client = getUnipile()
  const accountId = getAccountId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp: any = await (client as any).users.getReceivedInvites({ account_id: accountId })
  return resp?.items || []
}

async function classifyInvitation(
  profile: { name: string; headline?: string; location?: string },
  invitationText?: string
): Promise<ClassifyResult> {
  const icpContext = getICPPrompt()
  const prompt = `You are a LinkedIn connection request classifier. Given a profile and optional invitation message, decide whether to ACCEPT or DECLINE.

CRITERIA (evaluate all three):
1. **Founder/CEO check**: Must be a founder, CEO, co-founder, MD, owner, or director of their own business. DECLINE employees, job seekers, students, recruiters, "open to work" people.
2. **ICP match**: Does this person match any of these ideal customer profiles?
${icpContext}
3. **Spam check**: If an invitation message is included, check it's not a sales pitch, job offer, or link spam. No message is fine (common for real founders). Generic "I'd like to connect" is NOT spam.

When in doubt about ICP: lean ACCEPT if genuinely a founder/CEO.

Return JSON only (no markdown):
{"accept": true/false, "reason": "brief explanation", "isFounder": true/false, "isSpam": true/false, "icpMatch": "business name or empty string", "confidence": 0.0-1.0}`

  const userContent = [
    `Name: ${profile.name}`,
    `Headline: ${profile.headline || "N/A"}`,
    `Location: ${profile.location || "N/A"}`,
    invitationText ? `Invitation message: ${invitationText}` : "No invitation message",
  ].join("\n")

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "x-openclaw-agent-id": "main",
      "x-openclaw-session-key": "linkedin-invitations",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", stream: false,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userContent },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Gateway error ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ""
  const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim()
  return JSON.parse(cleaned) as ClassifyResult
}

async function acceptInvitation(invitationId: string): Promise<void> {
  const client = getUnipile()
  const accountId = getAccountId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).users.acceptInvite({ account_id: accountId, invite_id: invitationId })
}

async function declineInvitation(invitationId: string): Promise<void> {
  const client = getUnipile()
  const accountId = getAccountId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).users.declineInvite({ account_id: accountId, invite_id: invitationId })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendWelcomeSequence(
  inviterProviderId: string, firstName: string
): Promise<{ threadId: string; messagesSent: number }> {
  const client = getUnipile()
  const accountId = getAccountId()

  // Message 1 — start new chat
  let chatId = ""
  let threadId = ""
  const msg1 = WELCOME_MESSAGES[0](firstName)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp: any = await client.messaging.startNewChat({
        account_id: accountId,
        attendees_ids: [inviterProviderId],
        text: msg1,
      })
      chatId = resp?.chat_id || resp?.id || ""
      threadId = chatId
      break
    } catch (err) {
      if (attempt === 0) { await sleep(5000); continue }
      console.error("startNewChat failed after retry:", err)
      return { threadId: "", messagesSent: 0 }
    }
  }

  if (!chatId) return { threadId: "", messagesSent: 0 }
  let sent = 1

  // Message 2
  await sleep(3000)
  try {
    await client.messaging.sendMessage({ chat_id: chatId, text: WELCOME_MESSAGES[1]("") })
    sent = 2
  } catch (err) {
    console.error("Welcome msg 2 failed:", err)
    return { threadId, messagesSent: sent }
  }

  // Message 3
  await sleep(3000)
  try {
    await client.messaging.sendMessage({ chat_id: chatId, text: WELCOME_MESSAGES[2]("") })
    sent = 3
  } catch (err) {
    console.error("Welcome msg 3 failed:", err)
  }

  return { threadId, messagesSent: sent }
}

export interface ProcessingResult {
  processed: number; accepted: number; declined: number; errors: number
  details: Array<{ name: string; decision: InvitationDecision; reason: string }>
}

export async function processInvitations(): Promise<ProcessingResult> {
  if (!isUnipileConfigured()) throw new Error("Unipile not configured")

  const invitations = await fetchReceivedInvitations()
  const alreadyProcessed = new Set(getProcessedInvitationIds())

  const toProcess = invitations
    .filter((inv) => !alreadyProcessed.has(inv.id))
    .slice(0, MAX_PER_RUN)

  const result: ProcessingResult = { processed: 0, accepted: 0, declined: 0, errors: 0, details: [] }

  for (const inv of toProcess) {
    const sender = inv.sender || {}
    const name = sender.name || sender.first_name || "Unknown"
    const firstName = (sender.first_name || name.split(" ")[0] || "there")
    const headline = sender.headline || ""
    const location = sender.location || ""
    const providerId = sender.provider_id || sender.id || ""
    const profileUrl = sender.public_profile_url || sender.profile_url || ""

    let decision: InvitationDecision = "error"
    let reason = ""
    let icpMatch = ""

    try {
      // Step 1: Country check (deterministic)
      if (!isAllowedCountry(location, sender.locale)) {
        decision = "declined"
        reason = `Country not in allowlist: ${location || "unknown"}`
        try { await declineInvitation(inv.id) } catch { reason += " (decline API failed)" }
        const record = recordInvitation({
          unipileInvitationId: inv.id, inviterName: name, inviterHeadline: headline,
          inviterLocation: location, inviterProviderId: providerId,
          invitationText: inv.message || "", decision, reason,
        })
        result.declined++
        result.details.push({ name, decision, reason })
        result.processed++
        logActivity({ entityType: "linkedin", entityId: record.id, entityName: name, action: "created", detail: `Invitation declined: ${reason}` })
        continue
      }

      // Step 2: LLM classify
      const classification = await classifyInvitation(
        { name, headline, location }, inv.message
      )
      icpMatch = classification.icpMatch

      if (!classification.accept) {
        decision = "declined"
        reason = classification.reason
        try { await declineInvitation(inv.id) } catch { reason += " (decline API failed)" }
        const record = recordInvitation({
          unipileInvitationId: inv.id, inviterName: name, inviterHeadline: headline,
          inviterLocation: location, inviterProviderId: providerId,
          invitationText: inv.message || "", decision, reason, icpMatch,
        })
        result.declined++
        result.details.push({ name, decision, reason })
        result.processed++
        logActivity({ entityType: "linkedin", entityId: record.id, entityName: name, action: "created", detail: `Invitation declined: ${reason}` })
        continue
      }

      // Step 3: Accept
      await acceptInvitation(inv.id)
      decision = "accepted"
      reason = classification.reason

      const record = recordInvitation({
        unipileInvitationId: inv.id, inviterName: name, inviterHeadline: headline,
        inviterLocation: location, inviterProviderId: providerId,
        invitationText: inv.message || "", decision, reason, icpMatch,
      })

      // Step 4: Welcome sequence
      await sleep(2000)
      const welcome = await sendWelcomeSequence(providerId, firstName)

      if (welcome.threadId) {
        updateInvitationThread(record.id, welcome.threadId, welcome.messagesSent)
        // Upsert into linkedin_threads so it appears in inbox
        upsertThread({
          unipileId: welcome.threadId, participantId: providerId,
          participantName: name, participantHeadline: headline,
          participantAvatarUrl: sender.profile_pic_url || "",
          participantProfileUrl: profileUrl,
          lastMessage: WELCOME_MESSAGES[Math.min(welcome.messagesSent, 3) - 1]?.(firstName) || "",
          lastMessageAt: new Date().toISOString(),
          lastMessageDirection: "outgoing",
        })
      }

      result.accepted++
      result.details.push({ name, decision, reason })
      result.processed++
      logActivity({ entityType: "linkedin", entityId: record.id, entityName: name, action: "created", detail: `Invitation accepted: ${reason}` })
    } catch (err) {
      console.error(`Error processing invitation from ${name}:`, err)
      result.errors++
      result.details.push({ name, decision: "error", reason: String(err) })
      try {
        recordInvitation({
          unipileInvitationId: inv.id, inviterName: name, inviterHeadline: headline,
          inviterLocation: location, inviterProviderId: providerId,
          invitationText: inv.message || "", decision: "error",
          reason: err instanceof Error ? err.message : String(err),
        })
      } catch { /* best-effort */ }
      result.processed++
    }
  }

  return result
}
