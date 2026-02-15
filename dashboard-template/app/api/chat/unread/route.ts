import { NextRequest, NextResponse } from "next/server"

import { getUnreadCounts, markTopicRead } from "@/lib/db-chat"

export async function GET() {
  const counts = getUnreadCounts()
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  return NextResponse.json({ counts, total })
}

export async function POST(req: NextRequest) {
  const { topic } = await req.json()
  if (!topic || typeof topic !== "string") {
    return NextResponse.json({ error: "topic required" }, { status: 400 })
  }
  markTopicRead(topic)
  return NextResponse.json({ ok: true })
}
