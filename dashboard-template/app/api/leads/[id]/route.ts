import { NextRequest, NextResponse } from "next/server"
import { getLeadById, deleteLead } from "@/lib/db-leads"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const lead = getLeadById(id)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  return NextResponse.json({ lead })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withActivitySource(request, async () => {
    const { id } = await params
    deleteLead(id)
    return NextResponse.json({ success: true })
  })
}
