import type { HeartbeatEvent, HeartbeatStats } from "@/types"

const BASE_URL = "/api/heartbeats"

export async function getHeartbeatsApi(limit = 20, offset = 0): Promise<{ events: HeartbeatEvent[]; total: number }> {
  const res = await fetch(`${BASE_URL}?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error(`Heartbeats fetch failed: ${res.status}`)
  return res.json()
}

export async function getHeartbeatStatsApi(): Promise<HeartbeatStats> {
  const res = await fetch(`${BASE_URL}?stats=true`)
  if (!res.ok) throw new Error(`Heartbeat stats failed: ${res.status}`)
  const data = await res.json()
  return data.stats
}

export async function createHeartbeatApi(input: {
  status?: string
  model?: string
  duration?: number
  summary: string
  detail?: string
  triggeredBy?: string
}): Promise<HeartbeatEvent> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create heartbeat")
  const data = await res.json()
  return data.event
}
