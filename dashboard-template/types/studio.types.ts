export type PostFormat = "text" | "carousel" | "short_video" | "long_video" | "blog" | "quote_card"
export type PostStage = "Idea" | "Research" | "Draft" | "Review" | "Scheduled" | "Published" | "Filed"
export type PostPlatform = "linkedin" | "youtube" | "instagram" | "blog"
export type PlatformStatus = "draft" | "scheduled" | "published" | "failed"

export interface CarouselSlide {
  slideNumber: number
  text: string
  designNotes: string
}

export interface Post {
  id: string
  title: string
  format: PostFormat
  stage: PostStage
  caption: string
  body: string
  hook: string
  cta: string
  scriptNotes: string
  slides: CarouselSlide[]
  researchNotes: string
  topic: string
  hashtags: string[]
  goalId?: string
  priority: "High" | "Medium" | "Low"
  source: string
  parentPostId?: string
  platforms: PostPlatformEntry[]
  createdAt: string
  updatedAt: string
}

export interface PostPlatformEntry {
  id: string
  postId: string
  platform: PostPlatform
  platformStatus: PlatformStatus
  scheduledAt?: string
  publishedAt?: string
  publishedUrl?: string
  platformPostId?: string
  captionOverride?: string
  approvalId?: string
  error?: string
}

export interface PostMedia {
  id: string
  postId: string
  mediaType: "image" | "video" | "document"
  filename: string
  mimeType: string
  fileSize: number
  filePath: string
  sortOrder: number
  altText: string
  metadata?: string
}

export interface StudioColumn {
  id: PostStage
  name: string
  color: string
  items: Post[]
}
