export type ContentType =
  | "YouTube Script"
  | "Newsletter"
  | "Blog Post"
  | "Meeting Transcript"
  | "General Dictation"
  | "LinkedIn Content"

export type ContentStage = "Idea" | "Research" | "Draft" | "Review" | "Published" | "Filed"
export type ContentPlatform = "YouTube" | "Newsletter" | "Blog" | "LinkedIn" | "General"
export type ContentSource = "AI Suggestion" | "Manual" | "Trending" | "Repurpose" | "Meeting" | "Voice Input"

export interface ContentItem {
  id: string
  title: string
  contentType: ContentType
  stage: ContentStage
  goalId?: string
  topic: string
  researchNotes: string
  draft: string
  platform: ContentPlatform
  scheduledDate?: string
  priority: "High" | "Medium" | "Low"
  aiGenerated: boolean
  source: ContentSource
  createdAt: string
  updatedAt: string
}

export interface ContentColumn {
  id: ContentStage
  name: string
  color: string
  items: ContentItem[]
}
