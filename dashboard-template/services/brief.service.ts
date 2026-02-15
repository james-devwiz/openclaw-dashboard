import type { Brief, BriefType, BriefSearchParams, BriefSearchResult } from "@/types"

const BASE_URL = "/api/briefs"

export async function getBriefsApi(date?: string): Promise<Brief[]> {
  const url = date ? `${BASE_URL}?date=${encodeURIComponent(date)}` : BASE_URL
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Briefs fetch failed: ${res.status}`)
  const data = await res.json()
  return data.briefs || []
}

export async function createBriefApi(input: {
  briefType: BriefType
  title: string
  content: string
  date: string
  source?: string
  metadata?: string
}): Promise<Brief> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create brief")
  const data = await res.json()
  return data.brief
}

export async function deleteBriefApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete brief")
}

export async function searchBriefsApi(params: BriefSearchParams): Promise<BriefSearchResult> {
  const qs = new URLSearchParams({ mode: "search" })
  if (params.from) qs.set("from", params.from)
  if (params.to) qs.set("to", params.to)
  if (params.briefType) qs.set("briefType", params.briefType)
  if (params.kind) qs.set("kind", params.kind)
  if (params.source) qs.set("source", params.source)
  if (params.search) qs.set("search", params.search)
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.sortDir) qs.set("sortDir", params.sortDir)
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.offset) qs.set("offset", String(params.offset))

  const res = await fetch(`${BASE_URL}?${qs.toString()}`)
  if (!res.ok) throw new Error(`Brief search failed: ${res.status}`)
  return res.json()
}
