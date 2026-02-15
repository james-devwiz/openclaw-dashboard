export type DocumentCategory = "Meeting Transcript" | "Email Draft" | "Notes" | "Reference" | "Template"

export interface Document {
  id: string
  category: DocumentCategory
  title: string
  content: string
  tags: string         // comma-separated
  source: "manual" | "api" | "cron"
  createdAt: string
  updatedAt: string
}
