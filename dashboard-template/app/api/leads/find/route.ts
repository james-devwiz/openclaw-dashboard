import { NextRequest, NextResponse } from "next/server"
import { findLeads } from "@/lib/lead-signals"
import { withActivitySource } from "@/lib/activity-source"
import type { LeadBusiness } from "@/types"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const business = body.business as LeadBusiness | undefined
    const limit = parseInt(body.limit || "10")
    const autoEnrich = body.autoEnrich !== undefined ? body.autoEnrich : false

    try {
      const result = await findLeads({ business, limit, autoEnrich })

      return NextResponse.json({
        created: result.created,
        enriched: result.enriched,
        skipped: result.skipped,
        errors: result.errors,
        leadIds: result.leadIds,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lead discovery failed"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  })
}
