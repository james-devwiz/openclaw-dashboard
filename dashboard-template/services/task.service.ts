import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource } from "@/types/index"

const BASE_URL = "/api/tasks"

export async function getTasksApi(goalId?: string): Promise<Task[]> {
  const url = goalId ? `${BASE_URL}?goalId=${encodeURIComponent(goalId)}` : BASE_URL
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Tasks fetch failed: ${res.status}`)
  const data = await res.json()
  return data.tasks || []
}

export async function createTaskApi(input: {
  name: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  category?: TaskCategory
  dueDate?: string
  source?: TaskSource
  goalId?: string
}): Promise<Task> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create task")
  const data = await res.json()
  return data.task
}

export async function updateTaskStatusApi(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, status }),
  })
  if (!res.ok) throw new Error("Failed to update task")
}

export async function updateTaskApi(
  taskId: string,
  updates: Partial<Pick<Task, "name" | "description" | "status" | "priority" | "category" | "dueDate" | "goalId">>
): Promise<Task> {
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update task")
  const data = await res.json()
  return data.task
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}?id=${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete task")
}

export interface TaskStats {
  total: number; thisWeek: number; today: number; inProgress: number; completionPercent: number
}

export async function getTaskStatsApi(category?: string): Promise<TaskStats> {
  const params = new URLSearchParams({ stats: "true" })
  if (category) params.set("category", category)
  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`)
  const data = await res.json()
  return data.stats
}
