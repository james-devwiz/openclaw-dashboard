export interface Comment {
  id: string
  taskId: string
  content: string
  source: "user" | "openclaw"
  createdAt: string
}
