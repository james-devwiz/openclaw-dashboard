// LinkedIn status colors, labels, category config, and filter options

import type { ThreadStatus, ThreadCategory, LinkedInActionStatus, LinkedInActionType } from "@/types"

export const STATUS_COLORS: Record<ThreadStatus, string> = {
  "unread": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "needs-reply": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "qualified": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "waiting": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "snoozed": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "archived": "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
}

export const STATUS_LABELS: Record<ThreadStatus, string> = {
  "unread": "Unread",
  "needs-reply": "Needs Reply",
  "qualified": "Qualified",
  "waiting": "Waiting",
  "snoozed": "Snoozed",
  "archived": "Archived",
}

export const CATEGORY_LABELS: Record<string, string> = {
  "sales_inquiry": "Sales Inquiry",
  "networking": "Networking",
  "job_opportunity": "Job Opportunity",
  "partnership": "Partnership",
  "recruiter": "Recruiter",
  "spam": "Spam",
  "support": "Support",
  "personal": "Personal",
  "other": "Other",
}

export const CATEGORY_COLORS: Record<string, string> = {
  "sales_inquiry": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "networking": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "job_opportunity": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "partnership": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "recruiter": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "spam": "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  "support": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "personal": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "other": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export const WAMP_BANDS: Array<{ min: number; max: number; label: string; color: string }> = [
  { min: 0, max: 20, label: "Cold", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { min: 21, max: 40, label: "Cool", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { min: 41, max: 60, label: "Warm", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { min: 61, max: 80, label: "Hot", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { min: 81, max: 100, label: "On Fire", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
]

export function getWampBand(score: number) {
  return WAMP_BANDS.find((b) => score >= b.min && score <= b.max) || WAMP_BANDS[0]
}

export const PARTNER_BADGE = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"

export const ACTION_STATUS_COLORS: Record<LinkedInActionStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  executed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

export const ACTION_TYPE_LABELS: Record<LinkedInActionType, string> = {
  send_message: "Send Message",
  send_invite: "Connection Request",
  create_post: "Create Post",
  react: "React",
  comment: "Comment",
}

export const INBOX_FILTERS: Array<{ value: string; label: string }> = [
  { value: "unread", label: "Unread" },
  { value: "needs-reply", label: "Needs Reply" },
  { value: "waiting", label: "Waiting" },
  { value: "partners", label: "Partners" },
  { value: "spammers", label: "Spammers" },
  { value: "snoozed", label: "Snoozed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
]

export const CATEGORY_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Categories" },
  { value: "sales_inquiry", label: "Sales Inquiry" },
  { value: "networking", label: "Networking" },
  { value: "job_opportunity", label: "Job Opportunity" },
  { value: "partnership", label: "Partnership" },
  { value: "recruiter", label: "Recruiter" },
  { value: "personal", label: "Personal" },
  { value: "support", label: "Support" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
]

/** Human-readable relative time (e.g. "2h ago", "3d ago") */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
