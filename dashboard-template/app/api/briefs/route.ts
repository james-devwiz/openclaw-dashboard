import { NextRequest, NextResponse } from "next/server"
import { getBriefs, getBriefsInRange, createBrief, deleteBrief, searchBriefs, countBriefs, getBriefTypeCounts } from "@/lib/db-briefs"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode")

  if (mode === "search") {
    const opts = {
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      briefType: searchParams.get("briefType") || undefined,
      kind: searchParams.get("kind") || undefined,
      source: searchParams.get("source") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortDir: searchParams.get("sortDir") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    }
    const briefs = searchBriefs(opts)
    const total = countBriefs(opts)
    const typeCounts = getBriefTypeCounts(opts)
    return NextResponse.json({ briefs, total, typeCounts })
  }

  const date = searchParams.get("date") || undefined
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (from && to) {
    const briefs = getBriefsInRange(from, to)
    return NextResponse.json({ briefs })
  }

  const briefs = getBriefs(date)
  return NextResponse.json({ briefs })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { briefType, title, content, date, source, metadata } = body

    if (!briefType || !title || !date) {
      return NextResponse.json({ error: "briefType, title, and date are required" }, { status: 400 })
    }

    const brief = createBrief({ briefType, title, content: content || "", date, source, metadata })
    return NextResponse.json({ brief }, { status: 201 })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteBrief(id)
    return NextResponse.json({ success: true })
  })
}
