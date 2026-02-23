import { NextRequest, NextResponse } from "next/server"
import { generateResearchSummary } from "@/lib/lead-outreach-gen"
import { getLeadById } from "@/lib/db-leads"
import { withActivitySource } from "@/lib/activity-source"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { leadId } = body
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    try {
      await generateResearchSummary(leadId)
      const lead = getLeadById(leadId)
      return NextResponse.json({ lead })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Research summary generation failed"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  })
}
