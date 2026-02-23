import { NextRequest, NextResponse } from "next/server"
import { getContent, createContent, updateContent, updateContentStage, deleteContent, getIdeas, countIdeas, getIdeaCategoryCounts } from "@/lib/db-content"
import { vetIdea } from "@/lib/idea-vetting"
import type { ContentStage } from "@/types"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode")

  if (mode === "ideas") {
    const params = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortDir: (searchParams.get("sortDir") || "DESC") as "ASC" | "DESC",
      limit: Number(searchParams.get("limit")) || 25,
      offset: Number(searchParams.get("offset")) || 0,
    }
    const ideas = getIdeas(params)
    const total = countIdeas(params)
    const categoryCounts = getIdeaCategoryCounts()
    return NextResponse.json({ ideas, total, categoryCounts })
  }

  const stage = searchParams.get("stage") || undefined
  const contentType = searchParams.get("contentType") || undefined
  const items = getContent(stage, contentType)
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { title, contentType, stage, goalId, topic, researchNotes, platform, scheduledDate, priority, source, ideaCategories, sourceUrl, sourceType, contentFormats } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    // AI vetting gate for ideas
    if (contentType === "Idea") {
      const vet = await vetIdea({ title, topic, researchNotes, ideaCategories, sourceUrl })
      if (vet.score <= 3) {
        return NextResponse.json({ vetted: false, vetScore: vet.score, vetReasoning: vet.reasoning, vetEvidence: vet.evidence })
      }
      const item = createContent({ title, contentType, stage, goalId, topic, researchNotes, platform, scheduledDate, priority, source, ideaCategories, sourceUrl, sourceType, contentFormats, vetScore: vet.score, vetReasoning: vet.reasoning, vetEvidence: vet.evidence })
      return NextResponse.json({ item, vetted: true }, { status: 201 })
    }

    const item = createContent({ title, contentType, stage, goalId, topic, researchNotes, platform, scheduledDate, priority, source, ideaCategories, sourceUrl, sourceType, contentFormats })
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
