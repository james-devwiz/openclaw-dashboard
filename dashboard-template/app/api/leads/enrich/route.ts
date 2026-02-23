import { NextRequest, NextResponse } from "next/server"
import { enrichLead } from "@/lib/lead-enrichment"
import { withActivitySource } from "@/lib/activity-source"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { leadId } = await request.json()
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    try {
      const result = await enrichLead(leadId)
      return NextResponse.json({
        lead: result.lead,
        sources: result.sources,
        errors: result.errors,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Enrichment failed"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  })
}
