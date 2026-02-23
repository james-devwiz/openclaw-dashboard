export interface Comment {
  id: string
  taskId: string
  content: string
  source: "user" | "openclaw"
  createdAt: string
}

export interface LeadComment {
  id: string
  leadId: string
  content: string
  source: "user" | "openclaw"
  createdAt: string
}
