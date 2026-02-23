import { apiFetch } from "@/lib/api-client"
import type { Goal } from "@/types/index"

const BASE_URL = "/api/goals"

export async function getGoalsApi(): Promise<Goal[]> {
  const res = await apiFetch(BASE_URL)
  if (!res.ok) throw new Error(`Goals fetch failed: ${res.status}`)
  const data = await res.json()
  return data.goals || []
}

export async function createGoalApi(input: {
  name: string
  description?: string
  category?: string
  targetDate?: string
  metric?: string
  targetValue?: string
  priority?: string
}): Promise<Goal> {
  const res = await apiFetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create goal")
  const data = await res.json()
  return data.goal
}

export async function updateGoalApi(
  goalId: string,
  updates: Partial<Goal>
): Promise<Goal> {
  const res = await apiFetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update goal")
  const data = await res.json()
  return data.goal
}

export async function deleteGoalApi(goalId: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}?id=${encodeURIComponent(goalId)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete goal")
}
