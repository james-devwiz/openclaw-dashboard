import { NextRequest, NextResponse } from "next/server"
import { getHeartbeats, getHeartbeatStats, getHeartbeatCount, createHeartbeat } from "@/lib/db-heartbeats"
import { triggerHeartbeat } from "@/lib/gateway"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get("stats") === "true") {
    const stats = getHeartbeatStats()
    return NextResponse.json({ stats })
  }

  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)
  const events = getHeartbeats(limit, offset)
  const total = getHeartbeatCount()
  return NextResponse.json({ events, total })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()

    if (body.action === "trigger") {
      try {
        const result = await triggerHeartbeat()
        return NextResponse.json(result)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Trigger failed" },
          { status: 500 }
        )
      }
    }

    const { status, model, duration, summary, detail, triggeredBy } = body

    if (!summary) {
      return NextResponse.json({ error: "summary is required" }, { status: 400 })
    }

    const event = createHeartbeat({ status, model, duration, summary, detail, triggeredBy })
    return NextResponse.json({ event }, { status: 201 })
  })
}
