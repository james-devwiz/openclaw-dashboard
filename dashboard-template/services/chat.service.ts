import { apiFetch } from "@/lib/api-client"
import type { ChatMessageRow, ChatSession } from "@/types/index"

const HISTORY_URL = "/api/chat/history"
const SESSIONS_URL = "/api/chat/sessions"
const UNREAD_URL = "/api/chat/unread"

// --- Messages ---

export async function getChatHistoryApi(
  sessionId: string,
  signal?: AbortSignal,
): Promise<ChatMessageRow[]> {
  const res = await apiFetch(`${HISTORY_URL}?sessionId=${encodeURIComponent(sessionId)}`, { signal })
  if (!res.ok) throw new Error(`Chat history fetch failed: ${res.status}`)
  const data = await res.json()
  return data.messages || []
}

// --- Sessions ---

export async function getSessionsApi(topic: string): Promise<ChatSession[]> {
  const res = await apiFetch(`${SESSIONS_URL}?topic=${encodeURIComponent(topic)}`)
  if (!res.ok) throw new Error(`Sessions fetch failed: ${res.status}`)
  const data = await res.json()
  return data.sessions || []
}

export async function createSessionApi(topic: string): Promise<ChatSession> {
  const res = await apiFetch(SESSIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  })
  if (!res.ok) throw new Error("Failed to create session")
  const data = await res.json()
  return data.session
}

export async function renameSessionApi(sessionId: string, title: string): Promise<void> {
  const res = await apiFetch(`${SESSIONS_URL}/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error("Failed to rename session")
}

export async function deleteSessionApi(sessionId: string): Promise<void> {
  const res = await apiFetch(`${SESSIONS_URL}/${sessionId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete session")
}

// --- Unread counts ---

export async function getUnreadCountsApi(): Promise<{ counts: Record<string, number>; total: number }> {
  const res = await apiFetch(UNREAD_URL)
  if (!res.ok) throw new Error("Failed to fetch unread counts")
  return res.json()
}

export async function markTopicReadApi(topic: string): Promise<void> {
  await apiFetch(UNREAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  })
}
