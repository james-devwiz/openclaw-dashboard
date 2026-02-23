import { NextRequest, NextResponse } from "next/server"

import { getChatMessages, getLatestSession } from "@/lib/db-chat"

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams
  let sessionId = params.get("sessionId")

  // Fallback: load latest session for topic (backwards compat)
  if (!sessionId) {
    const topic = params.get("topic") || "general"
    const latest = getLatestSession(topic)
    if (!latest) return NextResponse.json({ messages: [] })
    sessionId = latest.id
  }

  const limit = parseInt(params.get("limit") || "100", 10)
  const messages = getChatMessages(sessionId, limit)
  return NextResponse.json({ messages })
}
