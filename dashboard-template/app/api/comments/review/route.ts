import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { generateReviewSummary } from "@/lib/task-review"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { taskId } = await request.json()
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 })
    }
    try {
      const comment = await generateReviewSummary(taskId)
      return NextResponse.json({ comment }, { status: 201 })
    } catch (err) {
      console.error("Review summary failed:", err)
      return NextResponse.json({ error: "Failed to generate review summary" }, { status: 500 })
    }
  })
}
