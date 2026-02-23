// Fetch LinkedIn posts for a contact via Unipile and cache on thread

import { NextRequest, NextResponse } from "next/server"
import { getUnipile, getAccountId, isUnipileConfigured } from "@/lib/unipile"
import { getThreadById, updateThread } from "@/lib/db-linkedin"
import { withActivitySource } from "@/lib/activity-source"

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    if (!isUnipileConfigured()) {
      return NextResponse.json({ error: "Unipile not configured" }, { status: 503 })
    }

    const { threadId } = await request.json()
    if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 })

    const thread = getThreadById(threadId)
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    // Return cached posts if available
    if (thread.postData) {
      try {
        return NextResponse.json({ posts: JSON.parse(thread.postData), cached: true })
      } catch (error) { console.error("Failed to parse cached post data:", error) }
    }

    // Resolve participant identifier
    let identifier = thread.participantId
    if (!identifier && thread.participantProfileUrl) {
      // Extract slug from profile URL as fallback
      const match = thread.participantProfileUrl.match(/\/in\/([^/?]+)/)
      if (match) identifier = match[1]
    }
    if (!identifier) {
      return NextResponse.json({ error: "No participant identifier available" }, { status: 400 })
    }

    try {
      const client = getUnipile()
      const accountId = getAccountId()
      const response: any = await client.users.getAllPosts({
        account_id: accountId,
        identifier,
        limit: 20,
      })

      const posts = response?.items || []
      const postsJson = JSON.stringify(posts)
      updateThread(threadId, { postData: postsJson })

      return NextResponse.json({ posts, cached: false })
    } catch (err) {
      console.error("Post fetch failed:", err)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 502 })
    }
  })
}
