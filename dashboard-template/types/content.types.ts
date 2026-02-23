export type ContentType =
  | "YouTube Script"
  | "Newsletter"
  | "Blog Post"
  | "Meeting Transcript"
  | "General Dictation"
  | "LinkedIn Content"
  | "Idea"

export type ContentStage = "Idea" | "Research" | "Draft" | "Review" | "Published" | "Filed"
export type ContentPlatform = "YouTube" | "Newsletter" | "Blog" | "LinkedIn" | "General"
export type ContentSource = "AI Suggestion" | "Manual" | "Trending" | "Repurpose" | "Meeting" | "Voice Input"

export type IdeaCategory = "Business Idea" | "Strategy Idea" | "Content Idea" | "AI Solution"
export type IdeaSourceType = "YouTube" | "Blog" | "Newsletter" | "Reddit" | "Podcast" | "Manual"
export type ContentFormat = "Static" | "Carousel" | "Short Form" | "Long Form"

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
  ideaCategories?: IdeaCategory[]
  sourceUrl?: string
  sourceType?: IdeaSourceType
  contentFormats?: ContentFormat[]
  promotedTaskId?: string
  promotedPipelineIds?: string[]
  vetScore?: number
  vetReasoning?: string
  vetEvidence?: string
  createdAt: string
  updatedAt: string
}

export interface ContentColumn {
  id: ContentStage
  name: string
  color: string
  items: ContentItem[]
}

// Idea source scanning types
export type IdeaSourcePlatform = "youtube" | "linkedin" | "x" | "reddit" | "website" | "email"
export type IdeaSourceFrequency = "daily" | "twice-weekly" | "weekly" | "fortnightly" | "monthly"

export interface IdeaSource {
  id: string
  platform: IdeaSourcePlatform
  url: string
  comments: string
  frequency: IdeaSourceFrequency
  cronJobId?: string
  cronJobName?: string
  validationScore?: number
  validationSummary?: string
  validationDetails?: string
  enabled: boolean
  lastRun?: string
  lastStatus?: string
  ideaCount?: number
  createdAt: string
  updatedAt: string
}

export interface IdeaSourceValidation {
  score: number
  summary: string
  details: string
  extractionPlan: string
}
