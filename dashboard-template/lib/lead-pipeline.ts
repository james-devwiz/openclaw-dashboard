// Lead pipeline orchestrator — direct execution, no approval gates

import { getLeadById, updateLead } from "./db-leads"
import { createLeadActivity } from "./db-lead-activities"
import { validateEmail } from "./zerobounce"
import { runCmd } from "./gateway"
import { generateFollowUp } from "./lead-outreach-gen"
import type { ApprovalStatus, CallOutcome } from "@/types"

/** Execute outreach from drafts — route based on available channels */
export async function executeOutreach(leadId: string): Promise<void> {
  const lead = getLeadById(leadId)
  if (!lead || !lead.outreachDrafts) return

  let drafts: Record<string, unknown> = {}
  try { drafts = JSON.parse(lead.outreachDrafts) } catch (error) { console.error("Failed to parse outreach drafts:", error); return }

  const hasLinkedIn = !!lead.linkedinUrl
  const hasEmail = !!lead.email

  if (hasLinkedIn) {
    const linkedin = drafts.linkedin as { connectionNote?: string } | undefined
    if (linkedin?.connectionNote) {
      createLeadActivity({
        leadId, activityType: "linkedin",
        content: `LinkedIn connection request queued (manual): "${linkedin.connectionNote.slice(0, 80)}..."`,
      })
    }
    updateLead(leadId, { status: "LinkedIn Request" })
    createLeadActivity({ leadId, activityType: "status_change", content: "Outreach started — LinkedIn Request" })
    return
  }

  if (hasEmail) {
    await advanceToEmail(leadId)
    return
  }

  // No LinkedIn, no email — go straight to Call
  updateLead(leadId, { status: "Call" })
  createLeadActivity({ leadId, activityType: "status_change", content: "Outreach started — straight to Call (no email/LinkedIn)" })
}

/** Mark LinkedIn connected → advance to email stage */
export async function markLinkedInConnected(leadId: string): Promise<void> {
  updateLead(leadId, { linkedinConnected: true })
  createLeadActivity({ leadId, activityType: "linkedin", content: "LinkedIn connection accepted" })

  const lead = getLeadById(leadId)
  if (lead?.email) {
    await advanceToEmail(leadId)
  } else {
    updateLead(leadId, { status: "Call" })
    createLeadActivity({ leadId, activityType: "status_change", content: "No email — advancing to Call" })
  }
}

/** Validate email, send initial email, advance to Call */
export async function advanceToEmail(leadId: string): Promise<void> {
  const lead = getLeadById(leadId)
  if (!lead) return

  // ZeroBounce validation
  if (lead.email) {
    try {
      const result = await validateEmail(lead.email)
      updateLead(leadId, { emailVerified: result.status })
      if (result.status === "invalid") {
        createLeadActivity({ leadId, activityType: "email", content: `Email invalid (${result.subStatus}) — skipping` })
        updateLead(leadId, { status: "Call" })
        createLeadActivity({ leadId, activityType: "status_change", content: "Email invalid — advancing to Call" })
        return
      }
    } catch (err) {
      createLeadActivity({ leadId, activityType: "email", content: `ZeroBounce failed: ${err instanceof Error ? err.message : "unknown"}` })
    }
  }

  // Send initial email
  let drafts: Record<string, unknown> = {}
  try { drafts = JSON.parse(lead.outreachDrafts) } catch (error) { console.error("Failed to parse outreach drafts for email:", error) }
  const email = drafts.email as { subject?: string; body?: string } | undefined

  if (email?.subject && email?.body) {
    const sent = await runCmd("himalaya", [
      "send", "--from", "outreach@example.com",
      "--to", lead.email, "--subject", email.subject, "--body", email.body,
    ], 15000)
    createLeadActivity({
      leadId, activityType: "email",
      content: sent ? "Initial email sent" : "Email send attempted",
    })
  }

  updateLead(leadId, { status: "Email", lastContactedAt: new Date().toISOString() })
  createLeadActivity({ leadId, activityType: "status_change", content: "Email sent — advancing to Call" })

  // Immediate advance to Call
  updateLead(leadId, { status: "Call" })
}

/** Log call outcome and generate AI follow-ups */
export async function logCallOutcome(
  leadId: string, outcome: CallOutcome, notes: string
): Promise<void> {
  updateLead(leadId, { callOutcome: outcome, callNotes: notes })
  createLeadActivity({
    leadId, activityType: "call",
    content: `Call outcome: ${outcome}${notes ? ` — ${notes}` : ""}`,
  })

  // Generate follow-up drafts
  const followUpDrafts = await generateFollowUp(leadId)
  updateLead(leadId, { followUpDrafts: JSON.stringify(followUpDrafts), status: "Follow-up Ready" })
  createLeadActivity({ leadId, activityType: "status_change", content: "Follow-ups generated — Follow-up Ready" })
}

/** Send follow-up messages via email + LinkedIn */
export async function executeFollowUp(leadId: string): Promise<void> {
  const lead = getLeadById(leadId)
  if (!lead || !lead.followUpDrafts) return

  let drafts: { email?: { subject: string; body: string }; linkedin?: { message: string } } = {}
  try { drafts = JSON.parse(lead.followUpDrafts) } catch (error) { console.error("Failed to parse follow-up drafts:", error); return }

  // Send follow-up email
  if (drafts.email?.subject && drafts.email?.body && lead.email) {
    const sent = await runCmd("himalaya", [
      "send", "--from", "outreach@example.com",
      "--to", lead.email, "--subject", drafts.email.subject, "--body", drafts.email.body,
    ], 15000)
    createLeadActivity({
      leadId, activityType: "email",
      content: sent ? "Follow-up email sent" : "Follow-up email send attempted",
    })
  }

  // Send LinkedIn follow-up if connected
  if (drafts.linkedin?.message && lead.linkedinConnected) {
    createLeadActivity({
      leadId, activityType: "linkedin",
      content: `LinkedIn follow-up queued (manual): "${drafts.linkedin.message.slice(0, 80)}..."`,
    })
  }

  updateLead(leadId, { status: "Follow Up", lastContactedAt: new Date().toISOString() })
  createLeadActivity({ leadId, activityType: "status_change", content: "Follow-ups sent — Follow Up" })
}

/** Backwards compat — no-op for legacy approvals */
export async function handleLeadApprovalResponse(
  leadId: string, _category: string, _status: ApprovalStatus
): Promise<void> {
  console.warn(`Legacy lead approval called for ${leadId} — approvals no longer used for leads`)
}
