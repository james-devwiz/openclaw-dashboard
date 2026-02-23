import { apiFetch } from "@/lib/api-client"
import type { Post, PostStage, PostFormat, PostPlatform, PostPlatformEntry, PostMedia, CarouselSlide } from "@/types"

const BASE = "/api/studio/posts"

export async function getPostsApi(stage?: PostStage, format?: PostFormat): Promise<Post[]> {
  const params = new URLSearchParams()
  if (stage) params.set("stage", stage)
  if (format) params.set("format", format)
  const qs = params.toString()
  const res = await apiFetch(qs ? `${BASE}?${qs}` : BASE)
  if (!res.ok) throw new Error(`Posts fetch failed: ${res.status}`)
  const data = await res.json()
  return data.posts || []
}

export async function getPostApi(id: string): Promise<Post> {
  const res = await apiFetch(`${BASE}/${id}`)
  if (!res.ok) throw new Error("Post not found")
  const data = await res.json()
  return data.post
}

export async function createPostApi(input: {
  title: string; format?: PostFormat; stage?: PostStage
  caption?: string; body?: string; hook?: string; cta?: string
  scriptNotes?: string; slides?: CarouselSlide[]
  topic?: string; hashtags?: string[]; goalId?: string; priority?: string
}): Promise<Post> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create post")
  const data = await res.json()
  return data.post
}

export async function updatePostApi(id: string, updates: Partial<Post>): Promise<Post> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error("Failed to update post")
  const data = await res.json()
  return data.post
}

export async function updatePostStageApi(id: string, stage: PostStage): Promise<void> {
  const res = await apiFetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, stage }),
  })
  if (!res.ok) throw new Error("Failed to update stage")
}

export async function deletePostApi(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete post")
}

export async function addPlatformApi(postId: string, platform: PostPlatform, captionOverride?: string): Promise<PostPlatformEntry> {
  const res = await apiFetch(`${BASE}/${postId}/platforms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, captionOverride }),
  })
  if (!res.ok) throw new Error("Failed to add platform")
  const data = await res.json()
  return data.platform
}

export async function removePlatformApi(postId: string, platformId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${postId}/platforms?platformId=${platformId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to remove platform")
}

export async function uploadMediaApi(postId: string, file: File): Promise<PostMedia> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiFetch(`${BASE}/${postId}/media`, { method: "POST", body: form })
  if (!res.ok) throw new Error("Failed to upload media")
  const data = await res.json()
  return data.media
}

export async function removeMediaApi(postId: string, mediaId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${postId}/media?mediaId=${mediaId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to remove media")
}

export async function generateDraftApi(input: {
  postId?: string; field: string; instruction?: string
}): Promise<{ draft?: string; drafts?: string[]; slides?: CarouselSlide[] }> {
  const res = await apiFetch("/api/studio/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Draft generation failed")
  return res.json()
}

export async function publishPostApi(postId: string, platformEntryId: string): Promise<{ url: string }> {
  const res = await apiFetch("/api/studio/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId, platformEntryId }),
  })
  if (!res.ok) throw new Error("Publishing failed")
  return res.json()
}
