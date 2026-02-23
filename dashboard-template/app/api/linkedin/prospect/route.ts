// LinkedIn Prospector — daily warm lead discovery from post engagement

import { NextRequest, NextResponse } from "next/server"
import { isUnipileConfigured } from "@/lib/unipile"
import { runLinkedInProspector } from "@/lib/linkedin-prospector"
import { withActivitySource } from "@/lib/activity-source"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    if (!isUnipileConfigured()) {
      return NextResponse.json({ error: "Unipile not configured" }, { status: 503 })
    }

    try {
      const result = await runLinkedInProspector()
      return NextResponse.json(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Prospector failed"
      console.error("LinkedIn Prospector error:", msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  })
}
