import { NextRequest, NextResponse } from "next/server"
import { getLeadComments, createLeadComment, deleteLeadComment } from "@/lib/db-lead-comments"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get("leadId")
  if (!leadId) {
    return NextResponse.json({ error: "leadId query param is required" }, { status: 400 })
  }
  const comments = getLeadComments(leadId)
  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { leadId, content, source } = body
    if (!leadId || !content) {
      return NextResponse.json({ error: "leadId and content are required" }, { status: 400 })
    }
    const comment = createLeadComment({ leadId, content, source })
    return NextResponse.json({ comment }, { status: 201 })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }
    deleteLeadComment(id)
    return NextResponse.json({ success: true })
  })
}
