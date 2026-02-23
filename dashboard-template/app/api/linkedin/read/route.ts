// Mark a LinkedIn thread as read — updates local DB + Unipile

import { NextRequest, NextResponse } from "next/server"
import { getThreadById, updateThread } from "@/lib/db-linkedin"
import { isUnipileConfigured } from "@/lib/unipile"
import { withActivitySource } from "@/lib/activity-source"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { threadId } = await request.json()
    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    const thread = getThreadById(threadId)
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Update local DB: clear unread count (status stays as-is — "unread" is not a status)
    const updated = updateThread(threadId, { unreadCount: 0 })

    // Mark as read in Unipile via REST API (best-effort)
    if (isUnipileConfigured() && thread.unipileId) {
      try {
        const dsn = process.env.UNIPILE_DSN || ""
        const token = process.env.UNIPILE_API_KEY || ""
        await fetch(`https://${dsn}/api/v1/chats/${thread.unipileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-API-KEY": token },
          body: JSON.stringify({ action: "setReadStatus", value: true }),
        })
      } catch (err) {
        console.error("Failed to mark as read in Unipile:", err)
      }
    }

    return NextResponse.json({ thread: updated })
  })
}
