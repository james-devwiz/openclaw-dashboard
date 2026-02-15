import { NextRequest, NextResponse } from "next/server"

import { getSessionsForTopic, createSession } from "@/lib/db-chat"

export async function GET(request: NextRequest) {
  const topic = new URL(request.url).searchParams.get("topic") || "general"
  const sessions = getSessionsForTopic(topic)
  return NextResponse.json({ sessions })
}

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 })
    }
    const session = createSession(topic)
    return NextResponse.json({ session }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
