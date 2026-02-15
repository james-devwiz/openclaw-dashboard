import type { MemoryItem, MemoryCategory, MemorySuggestion, SuggestionStatus } from "@/types/index"

const BASE_URL = "/api/memory"

export async function getMemoryItemsApi(
  category?: MemoryCategory,
  query?: string
): Promise<MemoryItem[]> {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  if (query) params.set("q", query)
  const qs = params.toString()

  const res = await fetch(qs ? `${BASE_URL}?${qs}` : BASE_URL)
  if (!res.ok) throw new Error(`Memory fetch failed: ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export async function getMemoryItemApi(encodedPath: string): Promise<MemoryItem | null> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(encodedPath)}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.item || null
}

export async function updateMemoryItemApi(
  encodedPath: string,
  content: string
): Promise<MemoryItem | null> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(encodedPath)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(`Memory save failed: ${res.status}`)
  const data = await res.json()
  return data.item || null
}

export async function saveToMemoryApi(opts: {
  action: "create" | "append"
  relativePath: string
  content: string
}): Promise<void> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  })
  if (!res.ok) throw new Error(`Save to memory failed: ${res.status}`)
}

export async function getMemoryRefsApi(): Promise<Record<string, string[]>> {
  const res = await fetch(`${BASE_URL}?refs=true`)
  if (!res.ok) throw new Error(`Memory refs fetch failed: ${res.status}`)
  const data = await res.json()
  return data.refs || {}
}

export async function getMemoryCategoryCountsApi(): Promise<Record<string, number>> {
  const res = await fetch(`${BASE_URL}?counts=true`)
  if (!res.ok) throw new Error(`Memory counts fetch failed: ${res.status}`)
  const data = await res.json()
  return data.counts || {}
}

export async function getMemorySuggestionsApi(status?: SuggestionStatus): Promise<MemorySuggestion[]> {
  const url = status ? `${BASE_URL}/suggestions?status=${status}` : `${BASE_URL}/suggestions`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Suggestions fetch failed: ${res.status}`)
  const data = await res.json()
  return data.suggestions || []
}

export interface GitLogEntry {
  hash: string
  date: string
  message: string
}

export async function getMemoryHistoryApi(encodedPath: string): Promise<GitLogEntry[]> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(encodedPath)}/history`)
  if (!res.ok) return []
  const data = await res.json()
  return data.history || []
}

export async function getMemoryDiffApi(encodedPath: string, from: string, to = "HEAD"): Promise<string> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(encodedPath)}/diff?from=${from}&to=${to}`)
  if (!res.ok) return ""
  const data = await res.json()
  return data.diff || ""
}

export async function respondToSuggestionApi(
  id: string,
  status: SuggestionStatus,
  extra?: { title?: string; content?: string; targetFile?: string; targetCategory?: string }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/suggestions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, ...extra }),
  })
  if (!res.ok) throw new Error(`Suggestion response failed: ${res.status}`)
}
