// SSE stream processing and message building for project chat

import type { ChatMessage, ChatAttachment } from "@/types/index"

import { apiFetch } from "@/lib/api-client"

/** Build history array from existing messages for API request */
export function buildProjectHistory(
  messages: ChatMessage[],
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m.status !== "error" && m.content.trim())
    .slice(-200)
    .map((m) => ({ role: m.role, content: m.content }))
}

/** Build the request body for project chat API */
export function buildProjectChatBody(opts: {
  message: string
  sessionId: string
  history: Array<{ role: string; content: string }>
  selectedModel: string | null
  attachments?: ChatAttachment[]
}): string {
  return JSON.stringify({
    message: opts.message,
    sessionId: opts.sessionId,
    history: opts.history,
    ...(opts.selectedModel ? { model: opts.selectedModel } : {}),
    ...(opts.attachments?.length
      ? { attachments: opts.attachments.map((a) => ({ name: a.name, type: a.type, dataUrl: a.dataUrl })) }
      : {}),
  })
}

/** Initiate the streaming fetch to the project chat endpoint */
export async function fetchProjectChatStream(
  projectId: string,
  body: string,
  signal: AbortSignal,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const res = await apiFetch(`/api/projects/${projectId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error("No response stream")
  return reader
}

/** Process the SSE stream and return accumulated content via callback */
export async function processSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (accumulated: string) => void,
): Promise<string> {
  const decoder = new TextDecoder()
  let buffer = ""
  let accumulated = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data: ")) continue
      const data = trimmed.slice(6)
      if (data === "[DONE]") continue
      try {
        const parsed = JSON.parse(data)
        if (parsed.content) {
          accumulated += parsed.content
          onChunk(accumulated)
        }
      } catch { /* skip malformed */ }
    }
  }

  return accumulated
}

export function parseAttachments(json?: string): ChatAttachment[] | undefined {
  if (!json) return undefined
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    return parsed.map((a: { name: string; type: string }) => ({ name: a.name, type: a.type, dataUrl: "" }))
  } catch { return undefined }
}
