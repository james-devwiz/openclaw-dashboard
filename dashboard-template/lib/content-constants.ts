// Shared idea category colours, source types, format colours, and cron prefix

import type { IdeaCategory, IdeaSourceType, ContentFormat, ContentStage, IdeaSourcePlatform, IdeaSourceFrequency } from "@/types"

export const ALL_IDEA_CATEGORIES: IdeaCategory[] = [
  "Business Idea", "Strategy Idea", "Content Idea", "AI Solution",
]

export const IDEA_CATEGORY_COLORS: Record<IdeaCategory, { bg: string; text: string }> = {
  "Business Idea": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "Strategy Idea": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "Content Idea": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "AI Solution": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
}

export const ALL_IDEA_SOURCE_TYPES: IdeaSourceType[] = [
  "YouTube", "Blog", "Newsletter", "Reddit", "Podcast", "Manual",
]

export const ALL_CONTENT_FORMATS: ContentFormat[] = [
  "Static", "Carousel", "Short Form", "Long Form",
]

export const CONTENT_FORMAT_COLORS: Record<ContentFormat, { bg: string; text: string }> = {
  "Static": { bg: "bg-gray-100 dark:bg-gray-800/30", text: "text-gray-700 dark:text-gray-300" },
  "Carousel": { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  "Short Form": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  "Long Form": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
}

/** Pipeline stages (excludes "Idea" — ideas live in Ideas tab, not pipeline) */
export const PIPELINE_STAGES: ContentStage[] = ["Research", "Draft", "Review", "Published", "Filed"]

/** Naming convention for idea source cron jobs */
export const IDEA_CRON_PREFIX = "idea-scan-"

/** Structured idea source platforms */
export const ALL_SOURCE_PLATFORMS: { id: IdeaSourcePlatform; label: string; icon: string; comingSoon?: boolean }[] = [
  { id: "youtube", label: "YouTube", icon: "Youtube" },
  { id: "linkedin", label: "LinkedIn", icon: "Linkedin" },
  { id: "x", label: "X (Twitter)", icon: "Twitter" },
  { id: "reddit", label: "Reddit", icon: "MessageCircle" },
  { id: "website", label: "Blog / Website", icon: "Globe" },
  { id: "email", label: "Email", icon: "Mail", comingSoon: true },
]

/** Structured idea source frequencies */
export const ALL_SOURCE_FREQUENCIES: { id: IdeaSourceFrequency; label: string; cron: string }[] = [
  { id: "daily", label: "Daily", cron: "0 6 * * *" },
  { id: "twice-weekly", label: "Twice Weekly", cron: "0 6 * * 1,4" },
  { id: "weekly", label: "Weekly", cron: "0 6 * * 1" },
  { id: "fortnightly", label: "Fortnightly", cron: "0 6 1,15 * *" },
  { id: "monthly", label: "Monthly", cron: "0 6 1 * *" },
]

export const PLATFORM_COLORS: Record<IdeaSourcePlatform, { bg: string; text: string }> = {
  youtube: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  linkedin: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  x: { bg: "bg-gray-100 dark:bg-gray-800/30", text: "text-gray-700 dark:text-gray-300" },
  reddit: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  website: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  email: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
}

export const FREQUENCY_CRON_MAP: Record<IdeaSourceFrequency, string> = {
  daily: "0 6 * * *",
  "twice-weekly": "0 6 * * 1,4",
  weekly: "0 6 * * 1",
  fortnightly: "0 6 1,15 * *",
  monthly: "0 6 1 * *",
}
