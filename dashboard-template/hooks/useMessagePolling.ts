"use client" // Requires useEffect and useRef for polling interval management

import { useEffect, useRef } from "react"

import { getChatHistoryApi } from "@/services/chat.service"
import type { ChatMessage, ChatTopic, ChatAttachment } from "@/types/index"

function parseAttachments(json?: string): ChatAttachment[] | undefined {
  if (!json) return undefined
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    return parsed.map((a: { name: string; type: string }) => ({ name: a.name, type: a.type, dataUrl: "" }))
  } catch { return undefined }
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_DURATION_MS = 60000

/**
 * Polls for assistant responses that may have been saved to DB after the client
 * disconnected mid-stream. Activates only when the last message in a session
 * is from the user (indicating a missing assistant response).
 */
export function useMessagePolling(
  sessionId: string | null,
  messages: ChatMessage[],
  isStreaming: boolean,
  activeTopic: ChatTopic,
  onMessagesUpdated: (sessionId: string, msgs: ChatMessage[]) => void,
) {
  const callbackRef = useRef(onMessagesUpdated)
  callbackRef.current = onMessagesUpdated

  const topicRef = useRef(activeTopic)
  topicRef.current = activeTopic

  useEffect(() => {
    if (!sessionId || isStreaming || messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== "user") return

    const startTime = Date.now()
    const sid = sessionId

    const interval = setInterval(async () => {
      if (Date.now() - startTime > MAX_POLL_DURATION_MS) {
        clearInterval(interval)
        return
      }

      try {
        const rows = await getChatHistoryApi(sid)
        const lastRow = rows[rows.length - 1]
        if (lastRow?.role === "assistant") {
          const msgs: ChatMessage[] = rows.map((r) => ({
            id: r.id,
            role: r.role,
            content: r.content,
            timestamp: r.createdAt,
            topic: topicRef.current,
            sessionId: r.sessionId,
            status: "sent" as const,
            ...(r.attachments ? { attachments: parseAttachments(r.attachments) } : {}),
          }))
          callbackRef.current(sid, msgs)
          clearInterval(interval)
        }
      } catch {
        // fail silently — next poll will retry
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [sessionId, messages.length, isStreaming]) // eslint-disable-line react-hooks/exhaustive-deps
}
