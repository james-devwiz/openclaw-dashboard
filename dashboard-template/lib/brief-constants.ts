// Shared brief type colours, labels, and kind mapping

import type { BriefKind } from "@/types"

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  "Morning Brief": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "End of Day Report": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  "Pre-Meeting Brief": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  "Post-Meeting Report": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "Weekly Review": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Business Analysis": { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
  "Cost Report": { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  "Error Report": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  "Self-Improvement Report": { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  "Custom": { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300" },
}

export const TYPE_SHORT_LABELS: Record<string, string> = {
  "Morning Brief": "Morning",
  "End of Day Report": "EOD",
  "Pre-Meeting Brief": "Pre-Meeting",
  "Post-Meeting Report": "Post-Meeting",
  "Weekly Review": "Weekly",
  "Business Analysis": "Analysis",
  "Cost Report": "Cost",
  "Error Report": "Errors",
  "Self-Improvement Report": "Self-Improvement",
  "Custom": "Custom",
}

// Kind mapping — which types are briefs vs reports
export const TYPE_KIND: Record<string, BriefKind> = {
  "Morning Brief": "brief",
  "Pre-Meeting Brief": "brief",
  "End of Day Report": "report",
  "Post-Meeting Report": "report",
  "Weekly Review": "report",
  "Business Analysis": "report",
  "Cost Report": "report",
  "Error Report": "report",
  "Self-Improvement Report": "report",
  "Custom": "report",
}

export const BRIEF_TYPES: string[] = Object.entries(TYPE_KIND).filter(([, k]) => k === "brief").map(([t]) => t)
export const REPORT_TYPES: string[] = Object.entries(TYPE_KIND).filter(([, k]) => k === "report").map(([t]) => t)
