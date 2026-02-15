import { NextRequest, NextResponse } from "next/server"
import { getComments, createComment, deleteComment } from "@/lib/db-comments"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get("taskId")
  if (!taskId) {
    return NextResponse.json({ error: "taskId query param is required" }, { status: 400 })
  }
  const comments = getComments(taskId)
  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { taskId, content, source } = body
    if (!taskId || !content) {
      return NextResponse.json({ error: "taskId and content are required" }, { status: 400 })
    }
    const comment = createComment({ taskId, content, source })
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
    deleteComment(id)
    return NextResponse.json({ success: true })
  })
}
