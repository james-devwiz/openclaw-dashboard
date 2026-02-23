// LinkedIn messages — get for thread + send directly via Unipile

import { NextRequest, NextResponse } from "next/server"
import { getMessages, getThreadById, upsertMessage, upsertThread } from "@/lib/db-linkedin"
import { getUnipile, getAccountId, isUnipileConfigured } from "@/lib/unipile"
import { withActivitySource } from "@/lib/activity-source"
import { logActivity } from "@/lib/activity-logger"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get("threadId")

  if (!threadId) {
    return NextResponse.json({ error: "threadId query param is required" }, { status: 400 })
  }

  const messages = getMessages(threadId)
  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { threadId, content } = body

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }
    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }
    if (!isUnipileConfigured()) {
      return NextResponse.json({ error: "Unipile not configured" }, { status: 503 })
    }

    const thread = getThreadById(threadId)
    if (!thread?.unipileId) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Send directly via Unipile
    const client = getUnipile()
    let result: unknown
    try {
      result = await client.messaging.sendMessage({
        chat_id: thread.unipileId, text: content,
      })
    } catch (err) {
      console.error("Unipile sendMessage failed:", err)
      const detail = err instanceof Error ? err.message : "Unknown Unipile error"
      return NextResponse.json({ error: `Failed to send on LinkedIn: ${detail}` }, { status: 502 })
    }

    // Store message locally only after confirmed send
    const msgId = typeof result === "object" && result !== null
      ? String((result as Record<string, unknown>).id || crypto.randomUUID())
      : crypto.randomUUID()
    const now = new Date().toISOString()

    const message = upsertMessage({
      threadId, unipileId: msgId, senderId: "",
      senderName: "You", content, direction: "outgoing", timestamp: now,
    })

    // Update thread — last message + status to "waiting"
    upsertThread({
      unipileId: thread.unipileId, participantId: thread.participantId,
      participantName: thread.participantName,
      participantHeadline: thread.participantHeadline,
      participantAvatarUrl: thread.participantAvatarUrl,
      participantProfileUrl: thread.participantProfileUrl,
      lastMessage: content.slice(0, 200),
      lastMessageAt: now, lastMessageDirection: "outgoing",
      unreadCount: 0,
    })

    logActivity({
      entityType: "linkedin", entityId: threadId,
      entityName: thread.participantName,
      action: "created", detail: `Sent message: ${content.slice(0, 60)}`,
    })

    return NextResponse.json({ message, sent: true }, { status: 201 })
  })
}
