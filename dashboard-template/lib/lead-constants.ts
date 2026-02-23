import type { LeadStatus, LeadBusiness, LeadSource, CallOutcome } from "@/types/lead.types"

export const PIPELINE_STATUSES: LeadStatus[] = [
  "New", "Researching", "Qualified", "Outreach Ready",
  "LinkedIn Request", "Email", "Call", "Follow-up Ready", "Follow Up",
]

export const LEAD_STATUSES: LeadStatus[] = [
  ...PIPELINE_STATUSES, "Successful", "Unsuccessful", "Archived", "Contacted",
]

export const TERMINAL_STATUSES: LeadStatus[] = ["Successful", "Unsuccessful", "Archived"]

export const MANUAL_STAGES: LeadStatus[] = ["New", "Researching", "Qualified", "Call"]
export const ROTTING_HOURS = 48

export const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "#6b7280",
  Researching: "#818cf8",
  Qualified: "#10b981",
  "Outreach Ready": "#f59e0b",
  "LinkedIn Request": "#0077b5",
  Email: "#3b82f6",
  Call: "#f97316",
  "Follow-up Ready": "#a855f7",
  "Follow Up": "#8b5cf6",
  Successful: "#059669",
  Unsuccessful: "#ef4444",
  Archived: "#9ca3af",
  Contacted: "#3b82f6",
}

/** Emoji key: 👤 Manual, ⚡ Automation trigger, ➡️⚡ Auto-add + trigger */
export const STAGE_EMOJI: Record<string, string> = {
  "New": "👤",
  "Researching": "👤",
  "Qualified": "👤",
  "Outreach Ready": "⚡",
  "LinkedIn Request": "➡️⚡",
  "Email": "➡️⚡",
  "Call": "👤",
  "Follow-up Ready": "⚡",
  "Follow Up": "➡️⚡",
}

export const STAGE_INFO: Record<string, string> = {
  "New": "Leads discovered via chat or API",
  "Researching": "Actively researching — enrich via Apollo",
  "Qualified": "Meets ICP — generate outreach when ready",
  "Outreach Ready": "AI drafts generated — review & execute",
  "LinkedIn Request": "Connection request sent — waiting for accept",
  "Email": "Email sent — advancing to Call",
  "Call": "Ready to call — log outcome when done",
  "Follow-up Ready": "AI follow-ups generated — review & send",
  "Follow Up": "Follow-ups sent — awaiting response",
}

export const PIPELINE_LEGEND = [
  { emoji: "👤", label: "Manual — human-owned stage" },
  { emoji: "⚡", label: "Automation triggers when card enters" },
  { emoji: "➡️⚡", label: "Auto-added by system + triggers automation" },
  { emoji: "🔴", label: "Stale — no activity for 48h+ (manual stages only)" },
]

export const CALL_OUTCOMES: Array<{ value: CallOutcome; label: string }> = [
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no-answer", label: "No Answer" },
  { value: "declined", label: "Declined" },
]

export const BUSINESSES: LeadBusiness[] = ["Business A", "Business B", "Business C"]
export const SOURCES: LeadSource[] = ["Manual", "Bright Data", "Apollo", "Cron", "Referral", "Import", "LinkedIn"]

export const SCORE_THRESHOLDS = { hot: 80, warm: 50, cool: 20 } as const

export const SCORE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  hot: { label: "Hot", color: "text-white", bg: "bg-red-500" },
  warm: { label: "Warm", color: "text-white", bg: "bg-amber-500" },
  cool: { label: "Cool", color: "text-white", bg: "bg-blue-500" },
  cold: { label: "Cold", color: "text-white", bg: "bg-gray-400" },
}

export function getScoreLevel(score: number): string {
  if (score >= SCORE_THRESHOLDS.hot) return "hot"
  if (score >= SCORE_THRESHOLDS.warm) return "warm"
  if (score >= SCORE_THRESHOLDS.cool) return "cool"
  return "cold"
}

export const CSV_HEADERS = [
  "Company", "Contact", "Title", "Email", "Phone", "Website", "LinkedIn",
  "Location", "Status", "Score", "Source", "Signal", "Notes", "Created",
]
