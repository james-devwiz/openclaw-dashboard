// Enrich LinkedIn thread contact via Apollo.io

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getThreadById, updateThread } from "@/lib/db-linkedin"
import { enrichPerson, enrichOrganization, isApolloConfigured } from "@/lib/apollo"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { threadId } = body
    if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 })

    if (!isApolloConfigured()) {
      return NextResponse.json({ error: "Apollo API not configured" }, { status: 503 })
    }

    const thread = getThreadById(threadId)
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    // Return cached data if already enriched
    if (thread.enrichmentData) {
      try {
        return NextResponse.json(JSON.parse(thread.enrichmentData))
      } catch (error) {
        // Invalid cached data, re-enrich
        console.error("Invalid cached enrichment data, re-enriching:", error)
      }
    }

    if (!thread.participantProfileUrl) {
      return NextResponse.json({ error: "No profile URL to enrich" }, { status: 400 })
    }

    try {
      const person = await enrichPerson({ linkedinUrl: thread.participantProfileUrl })
      let organization = null

      if (person?.organization?.website_url) {
        try {
          const domain = new URL(person.organization.website_url).hostname
          organization = await enrichOrganization(domain)
        } catch (error) {
          // org enrichment is optional
          console.error("Org enrichment failed:", error)
        }
      }

      const result = { person, organization }
      updateThread(threadId, { enrichmentData: JSON.stringify(result) })

      return NextResponse.json(result)
    } catch (err) {
      console.error("Enrichment failed:", err)
      return NextResponse.json({ error: "Enrichment failed" }, { status: 500 })
    }
  })
}
