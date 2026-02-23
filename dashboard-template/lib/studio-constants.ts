// Content Studio constants — format/platform/stage colours and labels

import type { PostFormat, PostStage, PostPlatform } from "@/types/studio.types"

export const ALL_FORMATS: PostFormat[] = ["text", "carousel", "short_video", "long_video", "blog", "quote_card"]

export const FORMAT_LABELS: Record<PostFormat, string> = {
  text: "Text Post",
  carousel: "Carousel",
  short_video: "Short Video",
  long_video: "Long Video",
  blog: "Blog Post",
  quote_card: "Quote Card",
}

export const FORMAT_COLORS: Record<PostFormat, { bg: string; text: string }> = {
  text: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  carousel: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  short_video: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  long_video: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  blog: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  quote_card: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
}

export const ALL_PLATFORMS: PostPlatform[] = ["linkedin", "youtube", "instagram", "blog"]

export const PLATFORM_LABELS: Record<PostPlatform, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  instagram: "Instagram",
  blog: "Blog",
}

export const PLATFORM_COLORS: Record<PostPlatform, { bg: string; text: string }> = {
  linkedin: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  youtube: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  instagram: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  blog: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
}

export const STUDIO_STAGES: PostStage[] = ["Idea", "Research", "Draft", "Review", "Scheduled", "Published", "Filed"]
export const PIPELINE_STAGES: PostStage[] = ["Research", "Draft", "Review", "Scheduled", "Published", "Filed"]

export const STAGE_COLORS: Record<PostStage, string> = {
  Idea: "#8b5cf6",
  Research: "#3b82f6",
  Draft: "#f59e0b",
  Review: "#f97316",
  Scheduled: "#06b6d4",
  Published: "#10b981",
  Filed: "#6b7280",
}
