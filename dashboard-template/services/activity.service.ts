import { apiFetch } from "@/lib/api-client"
import type { ActivityItem, ActivityEntityType } from "@/types/activity.types"

const BASE_URL = "/api"

export async function getActivityApi(params?: {
  entityType?: ActivityEntityType
  limit?: number
  offset?: number
}): Promise<{ items: ActivityItem[]; total: number }> {
  const query = new URLSearchParams()
  if (params?.entityType) query.set("entityType", params.entityType)
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.offset) query.set("offset", String(params.offset))

  try {
    const res = await apiFetch(`${BASE_URL}/activity?${query}`)
    if (!res.ok) return { items: [], total: 0 }
    return res.json()
  } catch {
    return { items: [], total: 0 }
  }
}

export async function getEntityActivitiesApi(
  entityType: ActivityEntityType,
  entityId: string
): Promise<ActivityItem[]> {
  try {
    const query = new URLSearchParams({ entityType, entityId })
    const res = await apiFetch(`${BASE_URL}/activity/entity?${query}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}
