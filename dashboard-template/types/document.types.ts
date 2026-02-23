export type DocumentCategory = "Meeting Transcript" | "Email Draft" | "Notes" | "Reference" | "Template" | "Research"

export type DocumentFolder = "general" | "system"

export interface Document {
  id: string
  category: DocumentCategory
  folder: DocumentFolder
  projectId?: string
  agentId?: string
  projectName?: string
  agentName?: string
  title: string
  content: string
  tags: string         // comma-separated
  source: "manual" | "api" | "cron"
  createdAt: string
  updatedAt: string
}
