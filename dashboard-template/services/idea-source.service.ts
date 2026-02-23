// Client-side API wrappers for idea sources

import { apiFetch } from "@/lib/api-client"
import type { IdeaSource, IdeaSourcePlatform, IdeaSourceFrequency, IdeaSourceValidation } from "@/types"

export async function getIdeaSourcesApi(): Promise<{ sources: IdeaSource[] }> {
  const res = await apiFetch("/api/idea-sources")
  if (!res.ok) throw new Error("Failed to fetch idea sources")
  return res.json()
}

export async function validateIdeaSourceApi(input: {
  platform: IdeaSourcePlatform
  url: string
  comments?: string
}): Promise<IdeaSourceValidation> {
  const res = await apiFetch("/api/idea-sources/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Validation failed")
  return res.json()
}

export async function createIdeaSourceApi(input: {
  platform: IdeaSourcePlatform
  url: string
  comments?: string
  frequency: IdeaSourceFrequency
  validationScore?: number
  validationSummary?: string
  validationDetails?: string
}): Promise<{ source: IdeaSource }> {
  const res = await apiFetch("/api/idea-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create idea source")
  return res.json()
}

export async function deleteIdeaSourceApi(id: string): Promise<void> {
  const res = await apiFetch("/api/idea-sources", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error("Failed to delete idea source")
}

export async function toggleIdeaSourceApi(id: string): Promise<{ source: IdeaSource }> {
  const res = await apiFetch(`/api/idea-sources/${id}/toggle`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to toggle idea source")
  return res.json()
}
