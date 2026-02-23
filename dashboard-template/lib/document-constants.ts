import type { DocumentCategory } from "@/types"

export const ALL_CATEGORIES: DocumentCategory[] = [
  "Meeting Transcript",
  "Email Draft",
  "Notes",
  "Reference",
  "Template",
  "Research",
]

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Meeting Transcript": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Email Draft": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  "Notes": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "Reference": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "Template": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "Research": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
}

export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  "Meeting Transcript": "Transcript",
  "Email Draft": "Email",
  "Notes": "Notes",
  "Reference": "Reference",
  "Template": "Template",
  "Research": "Research",
}

export const FOLDER_COLORS: Record<string, { bg: string; text: string }> = {
  general: { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-600 dark:text-gray-400" },
  system: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  project: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  agent: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
}
