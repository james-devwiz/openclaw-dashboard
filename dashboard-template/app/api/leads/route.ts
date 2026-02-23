import { NextRequest, NextResponse } from "next/server"
import { getLeads, getLeadCount, getLeadStats, getCallList, createLead, updateLead, deleteLead } from "@/lib/db-leads"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get("stats") === "true") {
    const business = searchParams.get("business") || undefined
    return NextResponse.json({ stats: getLeadStats(business) })
  }

  if (searchParams.get("callList") === "true") {
    const limit = parseInt(searchParams.get("limit") || "10")
    return NextResponse.json({ leads: getCallList(limit) })
  }

  const opts = {
    status: searchParams.get("status") || undefined,
    business: searchParams.get("business") || undefined,
    source: searchParams.get("source") || undefined,
    search: searchParams.get("search") || undefined,
    limit: parseInt(searchParams.get("limit") || "100"),
    offset: parseInt(searchParams.get("offset") || "0"),
  }

  const leads = getLeads(opts)
  const total = getLeadCount(opts)
  return NextResponse.json({ leads, total })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    if (!body.companyName) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 })
    }
    const lead = createLead(body)
    return NextResponse.json({ lead }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { leadId, ...updates } = body
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }
    const lead = updateLead(leadId, updates)
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    return NextResponse.json({ lead })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 })
    deleteLead(id)
    return NextResponse.json({ success: true })
  })
}
