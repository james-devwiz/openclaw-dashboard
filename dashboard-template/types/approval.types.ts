export type ApprovalCategory =
  | "Decision Needed"
  | "Information Requested"
  | "Content Review"
  | "Task Confirmation"
  | "Permission Request"
  | "LinkedIn"
  | "Lead Review"
  | "Outreach Review"

export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Deferred" | "Responded"
export type ApprovalPriority = "Urgent" | "High" | "Medium" | "Low"

export type ApprovalRequester =
  | "Morning Cron"
  | "Heartbeat"
  | "Overnight Work"
  | "Content Pipeline"
  | "Task Generation"
  | "LinkedIn Agent"
  | "Lead Pipeline"
  | "Manual"

export interface ApprovalItem {
  id: string
  title: string
  category: ApprovalCategory
  status: ApprovalStatus
  priority: ApprovalPriority
  context: string
  options: string
  response: string
  relatedGoalId?: string
  relatedTaskId?: string
  relatedTaskName?: string
  relatedLeadId?: string
  relatedLeadName?: string
  requestedBy: ApprovalRequester
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}
