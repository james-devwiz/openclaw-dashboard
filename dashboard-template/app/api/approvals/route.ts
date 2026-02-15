import { NextRequest, NextResponse } from "next/server"
import { getApprovals, createApproval, respondToApproval, deleteApproval, getApprovalByTaskId } from "@/lib/db-approvals"
import type { ApprovalStatus } from "@/types"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const taskId = searchParams.get("taskId")
  if (taskId) {
    const item = getApprovalByTaskId(taskId)
    return NextResponse.json({ item })
  }

  const status = searchParams.get("status") || undefined
  const items = getApprovals(status)
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { title, category, priority, context, options, relatedGoalId, relatedTaskId, requestedBy } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const item = createApproval({ title, category, priority, context, options, relatedGoalId, relatedTaskId, requestedBy })
    return NextResponse.json({ item }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id, status, response } = body as { id: string; status: ApprovalStatus; response: string }

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 })
    }

    const item = respondToApproval(id, status, response || "")
    if (!item) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }
    return NextResponse.json({ item })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteApproval(id)
    return NextResponse.json({ success: true })
  })
}
