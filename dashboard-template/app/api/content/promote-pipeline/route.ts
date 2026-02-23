import { NextRequest, NextResponse } from "next/server"
import { getContentById, promoteToPipeline } from "@/lib/db-content"
import { withActivitySource } from "@/lib/activity-source"
import type { ContentFormat, ContentType } from "@/types"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { contentId, formats, contentType } = body as {
      contentId: string
      formats: ContentFormat[]
      contentType: ContentType
    }

    if (!contentId || !formats?.length || !contentType) {
      return NextResponse.json({ error: "contentId, formats[], and contentType are required" }, { status: 400 })
    }

    const idea = getContentById(contentId)
    if (!idea || idea.contentType !== "Idea") {
      return NextResponse.json({ error: "Content item not found or not an Idea" }, { status: 404 })
    }

    const pipelineIds = promoteToPipeline(contentId, formats, contentType)
    return NextResponse.json({ pipelineIds }, { status: 201 })
  })
}
