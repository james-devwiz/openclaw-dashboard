export type ActivityEntityType = "task" | "goal" | "content" | "approval" | "chat" | "brief" | "heartbeat" | "memory" | "project" | "mcp" | "lead" | "linkedin" | "post"
export type ActivityAction = "created" | "updated" | "deleted" | "status_changed" | "stage_changed" | "responded" | "published" | "scheduled"

export interface ActivityItem {
  id: string
  entityType: ActivityEntityType
  entityId: string
  entityName: string
  action: ActivityAction
  detail: string
  changes: string
  source: string
  createdAt: string
}

export interface ActivityGroup {
  date: string
  items: ActivityItem[]
}
