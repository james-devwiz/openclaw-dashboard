// Chat persistence + mention system types

export interface ChatMessageRow {
  id: string
  topic: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface ChatSession {
  id: string
  topic: string
  title: string
  messageCount?: number
  createdAt: string
  updatedAt: string
}

export type MentionCategory = "Skills" | "Agents" | "Sub-Agents" | "Context" | "Models" | "System"

export interface MentionItem {
  id: string
  label: string
  category: MentionCategory
  description: string
}
