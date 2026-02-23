import { NextRequest, NextResponse } from "next/server"
import { generateOutreach } from "@/lib/lead-outreach-gen"
import { getLeadById } from "@/lib/db-leads"
import { withActivitySource } from "@/lib/activity-source"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { leadId } = await request.json()
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    const lead = getLeadById(leadId)
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    try {
      const drafts = await generateOutreach(leadId)
      const updated = getLeadById(leadId)
      return NextResponse.json({ lead: updated, drafts })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Outreach generation failed"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  })
}
