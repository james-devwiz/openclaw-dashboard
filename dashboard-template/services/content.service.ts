import { apiFetch } from "@/lib/api-client"
import type { ContentItem, ContentFormat, IdeaCategory, IdeaSourceType } from "@/types/index"

const BASE_URL = "/api/content"

export interface CreateContentResult {
  item?: ContentItem
  vetted?: boolean
  vetScore?: number
  vetReasoning?: string
  vetEvidence?: string
}

export async function createContentApi(input: {
  title: string
  contentType?: string
  stage?: string
  goalId?: string
  topic?: string
  researchNotes?: string
  platform?: string
  scheduledDate?: string
  priority?: string
  source?: string
  ideaCategories?: IdeaCategory[]
  sourceUrl?: string
  sourceType?: IdeaSourceType
  contentFormats?: ContentFormat[]
}): Promise<CreateContentResult> {
  const res = await apiFetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create content")
  return res.json()
}

export async function promoteToTaskApi(contentId: string, opts: {
  category?: string
  priority?: string
  comment?: string
}): Promise<{ taskId: string; description: string }> {
  const res = await apiFetch(`${BASE_URL}/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, ...opts }),
  })
  if (!res.ok) throw new Error("Failed to promote to task")
  return res.json()
}

export async function promoteToPipelineApi(contentId: string, opts: {
  formats: ContentFormat[]
  contentType: string
}): Promise<{ pipelineIds: string[] }> {
  const res = await apiFetch(`${BASE_URL}/promote-pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, ...opts }),
  })
  if (!res.ok) throw new Error("Failed to promote to pipeline")
  return res.json()
}

export interface IdeasSearchParams {
  category?: string
  search?: string
  sortBy?: string
  sortDir?: "ASC" | "DESC"
  limit?: number
  offset?: number
}

export async function getIdeasApi(params: IdeasSearchParams): Promise<{
  ideas: ContentItem[]
  total: number
  categoryCounts: Record<string, number>
}> {
  const qs = new URLSearchParams({ mode: "ideas" })
  if (params.category) qs.set("category", params.category)
  if (params.search) qs.set("search", params.search)
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.sortDir) qs.set("sortDir", params.sortDir)
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.offset) qs.set("offset", String(params.offset))
  const res = await apiFetch(`${BASE_URL}?${qs.toString()}`)
  if (!res.ok) throw new Error("Failed to fetch ideas")
  return res.json()
}
