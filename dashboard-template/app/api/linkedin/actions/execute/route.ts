// Execute an approved LinkedIn action via Unipile

import { NextRequest, NextResponse } from "next/server"
import { getUnipile, getAccountId, isUnipileConfigured } from "@/lib/unipile"
import { getActionById, updateActionStatus, getThreadById } from "@/lib/db-linkedin"
import { withActivitySource } from "@/lib/activity-source"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    if (!isUnipileConfigured()) {
      return NextResponse.json({ error: "Unipile not configured" }, { status: 503 })
    }

    const { actionId } = await request.json()
    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 })
    }

    const action = getActionById(actionId)
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 })
    }
    if (action.status !== "approved") {
      return NextResponse.json({ error: `Action status is ${action.status}, expected approved` }, { status: 400 })
    }

    const client = getUnipile()
    const accountId = getAccountId()

    try {
      const payload = JSON.parse(action.payload) as Record<string, unknown>

      switch (action.actionType) {
        case "send_message": {
          const { threadId, participantId, content } = payload as {
            threadId?: string; participantId?: string; content: string
          }

          if (threadId) {
            const thread = getThreadById(threadId)
            if (!thread?.unipileId) throw new Error("Thread not found or missing Unipile ID")
            await client.messaging.sendMessage({ chat_id: thread.unipileId, text: content })
          } else if (participantId) {
            await client.messaging.startNewChat({
              account_id: accountId,
              attendees_ids: [participantId],
              text: content,
            })
          } else {
            throw new Error("No threadId or participantId in payload")
          }
          break
        }

        case "send_invite": {
          const { identifier, message } = payload as { identifier: string; message?: string }
          // Use REST API for invitations
          const baseUrl = `https://${process.env.UNIPILE_DSN}`
          const res = await fetch(`${baseUrl}/api/v1/users/invite`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": process.env.UNIPILE_API_KEY || "",
            },
            body: JSON.stringify({ account_id: accountId, provider_id: identifier, message }),
          })
          if (!res.ok) throw new Error(`Invitation failed: ${res.status}`)
          break
        }

        case "create_post": {
          const { text } = payload as { text: string }
          const baseUrl = `https://${process.env.UNIPILE_DSN}`
          const res = await fetch(`${baseUrl}/api/v1/posts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": process.env.UNIPILE_API_KEY || "",
            },
            body: JSON.stringify({ account_id: accountId, text }),
          })
          if (!res.ok) throw new Error(`Post creation failed: ${res.status}`)
          break
        }

        case "react":
        case "comment": {
          const { postId, text: commentText, reactionType } = payload as {
            postId: string; text?: string; reactionType?: string
          }
          const baseUrl = `https://${process.env.UNIPILE_DSN}`
          const endpoint = action.actionType === "comment"
            ? `${baseUrl}/api/v1/posts/${postId}/comments`
            : `${baseUrl}/api/v1/posts/${postId}/reactions`
          const body = action.actionType === "comment"
            ? { account_id: accountId, text: commentText }
            : { account_id: accountId, reaction_type: reactionType || "LIKE" }

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": process.env.UNIPILE_API_KEY || "",
            },
            body: JSON.stringify(body),
          })
          if (!res.ok) throw new Error(`${action.actionType} failed: ${res.status}`)
          break
        }

        default:
          throw new Error(`Unknown action type: ${action.actionType}`)
      }

      const updated = updateActionStatus(actionId, "executed")
      return NextResponse.json({ action: updated })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("LinkedIn action execution failed:", message)
      updateActionStatus(actionId, "failed", message)
      return NextResponse.json({ error: "Execution failed" }, { status: 500 })
    }
  })
}
