import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getApprovalForRevision, reviseApproval } from "@/lib/db-approvals"
import { reviseApprovalWithAI } from "@/lib/approval-revision"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id, feedback } = body as { id: string; feedback: string }

    if (!id || !feedback?.trim()) {
      return NextResponse.json({ error: "id and feedback are required" }, { status: 400 })
    }

    const original = getApprovalForRevision(id)
    if (!original) {
      return NextResponse.json({ error: "Pending approval not found" }, { status: 404 })
    }

    const revised = await reviseApprovalWithAI({
      title: original.title,
      context: original.context,
      category: original.category,
      feedback,
    })

    const item = reviseApproval(id, revised.title, revised.context, feedback)
    if (!item) {
      return NextResponse.json({ error: "Failed to update approval" }, { status: 500 })
    }

    return NextResponse.json({ item })
  })
}
