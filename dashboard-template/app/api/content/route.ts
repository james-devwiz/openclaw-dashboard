import { NextRequest, NextResponse } from "next/server"
import { getContent, createContent, updateContent, updateContentStage, deleteContent } from "@/lib/db-content"
import type { ContentStage } from "@/types"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get("stage") || undefined
  const items = getContent(stage)
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { title, contentType, stage, goalId, topic, platform, scheduledDate, priority, source } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const item = createContent({ title, contentType, stage, goalId, topic, platform, scheduledDate, priority, source })
    return NextResponse.json({ item }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id, stage, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Stage-only update (drag and drop)
    if (stage && Object.keys(updates).length === 0) {
      updateContentStage(id, stage as ContentStage)
      return NextResponse.json({ success: true })
    }

    const item = updateContent(id, { stage, ...updates })
    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
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

    deleteContent(id)
    return NextResponse.json({ success: true })
  })
}
