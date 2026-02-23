// Sync LinkedIn threads + messages from Unipile into SQLite cache

import { NextResponse } from "next/server"
import { getUnipile, getAccountId, isUnipileConfigured } from "@/lib/unipile"
import { upsertThread, upsertMessage, getThreadByUnipileId, getUnclassifiedThreadIds } from "@/lib/db-linkedin"
import { withActivitySource } from "@/lib/activity-source"
import type { NextRequest } from "next/server"

/* eslint-disable @typescript-eslint/no-explicit-any */

function str(v: any): string { return v != null ? String(v) : "" }
function num(v: any): number { return typeof v === "number" ? v : 0 }

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    if (!isUnipileConfigured()) {
      return NextResponse.json({ error: "Unipile not configured" }, { status: 503 })
    }

    try {
      const client = getUnipile()
      const accountId = getAccountId()

      const chatsResponse: any = await client.messaging.getAllChats({
        account_id: accountId,
        limit: 100,
      })

      const items: any[] = chatsResponse?.items || []
      let synced = 0
      let created = 0

      for (const chat of items) {
        const chatId = str(chat.id)
        if (!chatId) continue

        // Fetch attendee details for this chat
        let attendeeName = "Unknown"
        let attendeeHeadline = ""
        let attendeeAvatar = ""
        let attendeeProfileUrl = ""
        let attendeeProviderId = str(chat.attendee_provider_id)

        try {
          const attendeesResp: any = await client.messaging.getAllAttendeesFromChat(chatId)
          const attendees: any[] = attendeesResp?.items || []
          if (attendees.length === 0) continue
          const other = attendees.find((a: any) => !a.is_self) || attendees[0]

          if (other) {
            attendeeName = str(other.name) || "Unknown"
            attendeeHeadline = str(other.specifics?.occupation || other.headline)
            attendeeAvatar = str(other.picture_url)
            attendeeProfileUrl = str(other.profile_url)
            attendeeProviderId = str(other.provider_id || attendeeProviderId)
          }
        } catch (error) {
          // Attendee lookup may fail for some chats — continue with defaults
          console.error("Attendee lookup failed for chat, using defaults:", error)
        }

        const existing = getThreadByUnipileId(chatId)
        if (!existing) created++

        upsertThread({
          unipileId: chatId,
          participantId: attendeeProviderId,
          participantName: attendeeName,
          participantHeadline: attendeeHeadline,
          participantAvatarUrl: attendeeAvatar,
          participantProfileUrl: attendeeProfileUrl,
          lastMessage: "",
          lastMessageAt: str(chat.timestamp),
          lastMessageDirection: "incoming",
          unreadCount: num(chat.unread_count),
        })

        // Sync messages for this chat
        try {
          const thread = getThreadByUnipileId(chatId)
          if (!thread) continue

          const messagesResponse: any = await client.messaging.getAllMessagesFromChat({ chat_id: chatId })
          const messages: any[] = messagesResponse?.items || []

          // Update thread's last message from actual message data
          if (messages.length > 0) {
            const latest = messages[0] // first item is most recent
            upsertThread({
              unipileId: chatId,
              participantId: attendeeProviderId,
              participantName: attendeeName,
              participantHeadline: attendeeHeadline,
              participantAvatarUrl: attendeeAvatar,
              participantProfileUrl: attendeeProfileUrl,
              lastMessage: str(latest.text).slice(0, 200),
              lastMessageAt: str(latest.timestamp || chat.timestamp),
              lastMessageDirection: latest.is_sender ? "outgoing" : "incoming",
              unreadCount: num(chat.unread_count),
            })
          }

          for (const msg of messages) {
            const msgId = str(msg.id)
            if (!msgId) continue

            upsertMessage({
              threadId: thread.id,
              unipileId: msgId,
              senderId: str(msg.sender_id),
              senderName: msg.is_sender ? "You" : attendeeName,
              content: str(msg.text),
              direction: msg.is_sender ? "outgoing" : "incoming",
              timestamp: str(msg.timestamp) || new Date().toISOString(),
            })
          }
        } catch (msgErr) {
          console.error(`Failed to sync messages for chat ${chatId}:`, msgErr)
        }

        synced++
      }

      // Trigger background classification for unclassified threads
      const unclassified = getUnclassifiedThreadIds().length

      return NextResponse.json({ synced, new: created, unclassified })
    } catch (err) {
      console.error("LinkedIn sync failed:", err)
      return NextResponse.json({ error: "Sync failed" }, { status: 500 })
    }
  })
}
