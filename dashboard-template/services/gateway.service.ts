import { apiFetch } from "@/lib/api-client"
import type { HealthStatus, GatewayConfig, CronJob } from "@/types/index"

const BASE_URL = "/api"

export async function getHealthApi(): Promise<HealthStatus> {
  const res = await apiFetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

export async function getGatewayConfigApi(): Promise<GatewayConfig | null> {
  try {
    const res = await apiFetch(`${BASE_URL}/gateway`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getCronJobsApi(): Promise<CronJob[]> {
  const res = await apiFetch(`${BASE_URL}/cron`)
  if (!res.ok) throw new Error(`Cron fetch failed: ${res.status}`)
  const data = await res.json()
  return data.jobs || []
}

export async function triggerCronJobApi(jobName: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/cron`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "trigger", jobName }),
  })
  if (!res.ok) throw new Error("Failed to trigger job")
}

export async function updateCronGoalApi(cronJobName: string, goalId: string | null): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/cron`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cronJobName, goalId }),
  })
  if (!res.ok) throw new Error("Failed to update cron goal")
}

