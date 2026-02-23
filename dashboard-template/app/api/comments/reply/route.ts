import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { generateReviewReply } from "@/lib/task-review"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { taskId, userMessage } = await request.json()
    if (!taskId || !userMessage) {
      return NextResponse.json({ error: "taskId and userMessage are required" }, { status: 400 })
    }
    try {
      const comment = await generateReviewReply(taskId, userMessage)
      return NextResponse.json({ comment }, { status: 201 })
    } catch (err) {
      console.error("Review reply failed:", err)
      return NextResponse.json({ error: "Failed to generate review reply" }, { status: 500 })
    }
  })
}
