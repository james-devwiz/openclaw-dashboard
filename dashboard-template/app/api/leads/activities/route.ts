import { NextRequest, NextResponse } from "next/server"
import { getLeadActivities, createLeadActivity } from "@/lib/db-lead-activities"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get("leadId")
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 })
  return NextResponse.json({ activities: getLeadActivities(leadId) })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { leadId, activityType, content, outcome } = body
  if (!leadId || !content) {
    return NextResponse.json({ error: "leadId and content required" }, { status: 400 })
  }
  const activity = createLeadActivity({
    leadId, activityType: activityType || "note", content, outcome,
  })
  return NextResponse.json({ activity }, { status: 201 })
}
