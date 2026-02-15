export type HeartbeatStatus = "success" | "failure" | "skipped"

export interface HeartbeatEvent {
  id: string
  status: HeartbeatStatus
  model: string
  duration: number       // ms
  summary: string
  detail: string         // full output/log
  triggeredBy: "heartbeat" | "manual"
  createdAt: string
}

export interface HeartbeatStats {
  total: number
  successCount: number
  failureCount: number
  lastHeartbeat: string | null
  avgDuration: number
}
