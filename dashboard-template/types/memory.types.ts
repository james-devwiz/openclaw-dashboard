export type MemoryCategory =
  | "core"
  | "business"
  | "orchestration"
  | "memory"
  | "research"
  | "projects"
  | "uncategorised"

export interface MemoryItem {
  id: string
  title: string
  category: MemoryCategory
  content: string
  excerpt: string
  filePath: string
  relativePath: string
  lastModified: string
}

export type SuggestionStatus = "pending" | "approved" | "dismissed"

export interface MemorySuggestion {
  id: string
  title: string
  content: string
  sourceType: string
  sourceId: string
  reason: string
  status: SuggestionStatus
  targetCategory: string
  targetFile: string
  createdAt: string
}

export interface SearchResult {
  type: "goal" | "task" | "content" | "approval" | "memory" | "document" | "lead"
  id: string
  title: string
  subtitle: string
  href: string
}
