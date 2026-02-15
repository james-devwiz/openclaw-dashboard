export type BriefType =
  | "Morning Brief" | "Pre-Meeting Brief"
  | "End of Day Report" | "Post-Meeting Report" | "Weekly Review" | "Business Analysis" | "Cost Report"
  | "Error Report" | "Self-Improvement Report"
  | "Custom"

export type BriefKind = "brief" | "report"

export interface Brief {
  id: string
  briefType: BriefType
  title: string
  content: string
  date: string       // YYYY-MM-DD
  source: "cron" | "manual" | "api" | "heartbeat"
  metadata?: string  // JSON for extra context (meeting name, etc.)
  createdAt: string
}

export interface BriefSearchParams {
  from?: string
  to?: string
  briefType?: string
  kind?: BriefKind
  source?: string
  search?: string
  sortBy?: "createdAt" | "date"
  sortDir?: "ASC" | "DESC"
  limit?: number
  offset?: number
}

export interface BriefSearchResult {
  briefs: Brief[]
  total: number
  typeCounts: Record<string, number>
}
