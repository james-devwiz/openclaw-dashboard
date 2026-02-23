// LinkedIn invitation processing — fetch + auto-process connection requests

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { processInvitations } from "@/lib/invitation-processor"
import { getRecentInvitations, getInvitationStats } from "@/lib/db-linkedin-invitations"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  const { invitations, total } = getRecentInvitations(limit, offset)
  const stats = getInvitationStats()
  return NextResponse.json({ invitations, total, stats })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    try {
      const result = await processInvitations()
      return NextResponse.json(result)
    } catch (err) {
      console.error("Invitation processing failed:", err)
      const detail = err instanceof Error ? err.message : "Unknown error"
      return NextResponse.json({ error: detail }, { status: 500 })
    }
  })
}
