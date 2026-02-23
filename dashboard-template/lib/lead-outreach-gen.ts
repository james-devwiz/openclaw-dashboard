// Outreach generation — uses gateway chat to create personalised email + LinkedIn drafts

import { getLeadById, updateLead } from "./db-leads"
import { createLeadActivity } from "./db-lead-activities"
import { OUTREACH_PRINCIPLES, EMAIL_SEQUENCE_TEMPLATES, LINKEDIN_MESSAGE_TEMPLATES } from "./lead-outreach"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

interface OutreachDrafts {
  email: { subject: string; body: string }
  bump: { subject: string; body: string }
  value: { subject: string; body: string }
  breakup: { subject: string; body: string }
  linkedin: { connectionNote: string; firstMessage: string }
}

/** Generate personalised outreach for a qualified lead */
export async function generateOutreach(leadId: string): Promise<OutreachDrafts> {
  const lead = getLeadById(leadId)
  if (!lead) throw new Error("Lead not found")

  const firstName = lead.contactName.split(" ")[0] || "there"
  const prompt = buildOutreachPrompt(lead, firstName)

  const response = await callGatewayChat(prompt)
  const drafts = parseOutreachResponse(response, firstName)

  updateLead(leadId, {
    outreachDrafts: JSON.stringify(drafts),
    status: "Outreach Ready",
  })

  createLeadActivity({ leadId, activityType: "note", content: "Outreach drafts generated" })
  return drafts
}

/** Regenerate outreach — overwrites existing drafts */
export async function regenerateOutreach(leadId: string): Promise<OutreachDrafts> {
  return generateOutreach(leadId)
}

/** Generate a 1-2 sentence research summary for a lead */
export async function generateResearchSummary(leadId: string): Promise<string> {
  const lead = getLeadById(leadId)
  if (!lead) throw new Error("Lead not found")

  const context = [
    `Company: ${lead.companyName}`,
    lead.industry ? `Industry: ${lead.industry}` : "",
    lead.website ? `Website: ${lead.website}` : "",
    lead.signalDetail ? `Signal: ${lead.signalDetail}` : "",
    lead.enrichmentData ? `Enrichment: ${lead.enrichmentData.slice(0, 500)}` : "",
    lead.companyData ? `Company data: ${lead.companyData.slice(0, 300)}` : "",
  ].filter(Boolean).join("\n")

  const prompt = `Based on this data, write 1-2 sentences: what does this company do, what's their core offer, and who do they target? Be concise and factual. No preamble.\n\n${context}`
  const summary = await callGatewayChat(prompt)
  updateLead(leadId, { researchSummary: summary.trim() })
  return summary.trim()
}

function buildOutreachPrompt(
  lead: { companyName: string; contactName: string; contactTitle: string; industry: string; business: string; signalDetail: string; website: string; enrichmentData: string },
  firstName: string
): string {
  return `You are a cold outreach copywriter. Generate personalised outreach for this lead.

${OUTREACH_PRINCIPLES}

## Email Templates (for reference — adapt, don't copy verbatim)
Initial: ${EMAIL_SEQUENCE_TEMPLATES.initial}
Bump: ${EMAIL_SEQUENCE_TEMPLATES.bump}
Value: ${EMAIL_SEQUENCE_TEMPLATES.value}
Breakup: ${EMAIL_SEQUENCE_TEMPLATES.breakup}

## LinkedIn Templates
Connection: ${LINKEDIN_MESSAGE_TEMPLATES.connectionNote}
First message: ${LINKEDIN_MESSAGE_TEMPLATES.firstMessage}

## Lead Data
- Company: ${lead.companyName}
- Contact: ${lead.contactName} (${lead.contactTitle})
- First name: ${firstName}
- Industry: ${lead.industry}
- Business: ${lead.business}
- Signal: ${lead.signalDetail}
- Website: ${lead.website}
${lead.enrichmentData ? `- Enrichment: ${lead.enrichmentData.slice(0, 500)}` : ""}

## Output Format (JSON only, no markdown)
{"email":{"subject":"...","body":"..."},"bump":{"subject":"Re: ...","body":"..."},"value":{"subject":"Re: ...","body":"..."},"breakup":{"subject":"Re: ...","body":"..."},"linkedin":{"connectionNote":"...","firstMessage":"..."}}`
}

async function callGatewayChat(prompt: string): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "x-openclaw-agent-id": "main",
      "x-openclaw-session-key": "outreach-gen",
    },
    body: JSON.stringify({
      model: "openclaw:main",
      stream: false,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Gateway error: ${res.status}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content || ""
}

export interface FollowUpDrafts {
  email: { subject: string; body: string }
  linkedin?: { message: string }
}

/** Generate context-aware follow-up drafts based on call outcome */
export async function generateFollowUp(leadId: string): Promise<FollowUpDrafts> {
  const lead = getLeadById(leadId)
  if (!lead) throw new Error("Lead not found")

  const firstName = lead.contactName.split(" ")[0] || "there"
  const prompt = `You are a follow-up copywriter. Generate a follow-up email${lead.linkedinConnected ? " and LinkedIn message" : ""}.

## Context
- Company: ${lead.companyName}
- Contact: ${lead.contactName} (${lead.contactTitle})
- Call outcome: ${lead.callOutcome || "unknown"}
- Call notes: ${lead.callNotes || "none"}
- LinkedIn connected: ${lead.linkedinConnected ? "yes" : "no"}
- Business: ${lead.business}
${lead.outreachDrafts ? `- Original outreach: ${lead.outreachDrafts.slice(0, 300)}` : ""}

${OUTREACH_PRINCIPLES}

## Output Format (JSON only, no markdown)
{"email":{"subject":"Re: ...","body":"..."}${lead.linkedinConnected ? ',"linkedin":{"message":"..."}' : ""}}`

  const response = await callGatewayChat(prompt)
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        email: { subject: parsed.email?.subject || `Following up, ${firstName}`, body: parsed.email?.body || "" },
        linkedin: parsed.linkedin ? { message: parsed.linkedin.message || "" } : undefined,
      }
    } catch (error) { console.error("Failed to parse follow-up response JSON:", error) }
  }

  return {
    email: { subject: `Following up, ${firstName}`, body: `Hi ${firstName}, just following up on our conversation.` },
    linkedin: lead.linkedinConnected ? { message: `Hi ${firstName}, following up from our call.` } : undefined,
  }
}

function parseOutreachResponse(raw: string, firstName: string): OutreachDrafts {
  // Try to extract JSON from response (may be wrapped in markdown)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        email: { subject: parsed.email?.subject || "", body: parsed.email?.body || "" },
        bump: { subject: parsed.bump?.subject || "", body: parsed.bump?.body || "" },
        value: { subject: parsed.value?.subject || "", body: parsed.value?.body || "" },
        breakup: { subject: parsed.breakup?.subject || "", body: parsed.breakup?.body || "" },
        linkedin: {
          connectionNote: parsed.linkedin?.connectionNote || "",
          firstMessage: parsed.linkedin?.firstMessage || "",
        },
      }
    } catch (error) { console.error("Failed to parse outreach response JSON:", error) }
  }

  // Fallback if parsing fails
  return {
    email: { subject: "Quick question", body: `Hey ${firstName}, would love to connect.` },
    bump: { subject: "Re: Quick question", body: `Just making sure this didn't get buried.` },
    value: { subject: "Re: Quick question", body: `Thought this might be useful.` },
    breakup: { subject: "Re: Quick question", body: `I'll assume this isn't a priority right now.` },
    linkedin: { connectionNote: `Hey ${firstName} — would love to connect.`, firstMessage: `Thanks for connecting, ${firstName}.` },
  }
}
