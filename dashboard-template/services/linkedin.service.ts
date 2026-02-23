import { apiFetch } from "@/lib/api-client"
import type { LinkedInThread, LinkedInMessage, LinkedInAction } from "@/types"

const BASE = "/api/linkedin"

// ── Threads ──

export async function getThreadsApi(opts?: {
  status?: string; search?: string; category?: string; limit?: number; offset?: number
}): Promise<{ threads: LinkedInThread[]; total: number }> {
  const params = new URLSearchParams()
  if (opts?.status) params.set("status", opts.status)
  if (opts?.search) params.set("search", opts.search)
  if (opts?.category) params.set("category", opts.category)
  if (opts?.limit) params.set("limit", String(opts.limit))
  if (opts?.offset) params.set("offset", String(opts.offset))
  const res = await apiFetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`Threads fetch failed: ${res.status}`)
  return res.json()
}

export async function updateThreadApi(
  threadId: string, updates: Record<string, unknown>
): Promise<LinkedInThread> {
  const res = await apiFetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update thread")
  const data = await res.json()
  return data.thread
}

// ── Messages ──

export async function getMessagesApi(threadId: string): Promise<LinkedInMessage[]> {
  const res = await apiFetch(`${BASE}/messages?threadId=${encodeURIComponent(threadId)}`)
  if (!res.ok) throw new Error(`Messages fetch failed: ${res.status}`)
  const data = await res.json()
  return data.messages || []
}

export async function sendMessageApi(input: {
  threadId?: string; content: string
}): Promise<{ message: LinkedInMessage; sent: boolean }> {
  const res = await apiFetch(`${BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to send message")
  return res.json()
}

// ── Actions ──

export async function getActionsApi(status?: string): Promise<LinkedInAction[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : ""
  const res = await apiFetch(`${BASE}/actions${params}`)
  if (!res.ok) throw new Error(`Actions fetch failed: ${res.status}`)
  const data = await res.json()
  return data.actions || []
}

export async function createActionApi(input: {
  actionType: string; targetId?: string; targetName?: string; payload: Record<string, unknown>
}): Promise<{ action: LinkedInAction }> {
  const res = await apiFetch(`${BASE}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create action")
  return res.json()
}

export async function executeActionApi(actionId: string): Promise<{ action: LinkedInAction }> {
  const res = await apiFetch(`${BASE}/actions/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionId }),
  })
  if (!res.ok) throw new Error("Failed to execute action")
  return res.json()
}

// ── Mark as read ──

export async function markAsReadApi(threadId: string): Promise<{ thread: LinkedInThread }> {
  const res = await apiFetch(`${BASE}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  })
  if (!res.ok) throw new Error("Failed to mark as read")
  return res.json()
}

// ── Sync + Classify ──

export async function syncLinkedInApi(): Promise<{ synced: number; new: number; unclassified: number }> {
  const res = await apiFetch(`${BASE}/sync`, { method: "POST" })
  if (!res.ok) throw new Error("Sync failed")
  return res.json()
}

export async function classifyThreadsApi(
  threadIds?: string[]
): Promise<{ classified: number }> {
  const res = await apiFetch(`${BASE}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadIds }),
  })
  if (!res.ok) throw new Error("Classification failed")
  return res.json()
}

// ── Score ──

export async function scoreThreadApi(
  threadId: string
): Promise<import("@/types").WampV2Score> {
  const res = await apiFetch(`${BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  })
  if (!res.ok) throw new Error("Scoring failed")
  return res.json()
}

// ── Enrich ──

export async function enrichThreadApi(
  threadId: string
): Promise<{ person: Record<string, unknown> | null; organization: Record<string, unknown> | null }> {
  const res = await apiFetch(`${BASE}/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  })
  if (!res.ok) throw new Error("Enrichment failed")
  return res.json()
}

// ── Draft ──

export async function generateDraftApi(
  threadId: string, instruction?: string
): Promise<{ drafts: string[] }> {
  const res = await apiFetch(`${BASE}/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, instruction }),
  })
  if (!res.ok) throw new Error("Draft generation failed")
  return res.json()
}

// ── Posts ──

export async function fetchPostsApi(
  threadId: string
): Promise<{ posts: Record<string, unknown>[]; cached: boolean }> {
  const res = await apiFetch(`${BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  })
  if (!res.ok) throw new Error("Post fetch failed")
  return res.json()
}

// ── Profile ──

export async function getProfileApi(identifier: string): Promise<Record<string, unknown>> {
  const res = await apiFetch(`${BASE}/profile?id=${encodeURIComponent(identifier)}`)
  if (!res.ok) throw new Error("Profile lookup failed")
  const data = await res.json()
  return data.profile
}

// ── Draft History ──

export async function getDraftHistoryApi(
  threadId: string
): Promise<import("@/types").DraftHistoryEntry[]> {
  const res = await apiFetch(`${BASE}/draft?threadId=${encodeURIComponent(threadId)}`)
  if (!res.ok) throw new Error("Draft history fetch failed")
  const data = await res.json()
  return data.history || []
}

export async function markDraftUsedApi(id: string, variantIndex: number): Promise<void> {
  const res = await apiFetch(`${BASE}/draft`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, variantIndex }),
  })
  if (!res.ok) throw new Error("Failed to mark draft used")
}

// ── Score History ──

export async function getScoreHistoryApi(
  threadId: string
): Promise<import("@/types").ScoreHistoryEntry[]> {
  const res = await apiFetch(`${BASE}/score?threadId=${encodeURIComponent(threadId)}`)
  if (!res.ok) throw new Error("Score history fetch failed")
  const data = await res.json()
  return data.history || []
}
