import type { SearchResult } from "@/types/index"

export async function globalSearchApi(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}
