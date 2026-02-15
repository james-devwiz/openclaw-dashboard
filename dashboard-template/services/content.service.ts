import type { ContentItem, ContentStage } from "@/types/index"

const BASE_URL = "/api/content"

export async function getContentApi(stage?: ContentStage): Promise<ContentItem[]> {
  const url = stage ? `${BASE_URL}?stage=${encodeURIComponent(stage)}` : BASE_URL
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Content fetch failed: ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export async function createContentApi(input: {
  title: string
  contentType?: string
  stage?: string
  goalId?: string
  topic?: string
  platform?: string
  scheduledDate?: string
  priority?: string
  source?: string
}): Promise<ContentItem> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create content")
  const data = await res.json()
  return data.item
}

export async function updateContentStageApi(
  id: string,
  stage: ContentStage
): Promise<void> {
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, stage }),
  })
  if (!res.ok) throw new Error("Failed to update content stage")
}

export async function updateContentApi(
  id: string,
  updates: Partial<ContentItem>
): Promise<ContentItem> {
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update content")
  const data = await res.json()
  return data.item
}
