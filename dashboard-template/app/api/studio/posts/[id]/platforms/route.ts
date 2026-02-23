import { NextRequest, NextResponse } from "next/server"
import { getPlatforms, addPlatform, updatePlatform, removePlatform } from "@/lib/db-post-platforms"
import { withActivitySource } from "@/lib/activity-source"
import type { PostPlatform } from "@/types/studio.types"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const platforms = getPlatforms(id)
  return NextResponse.json({ platforms })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withActivitySource(request, async () => {
    const { id } = await params
    const { platform, captionOverride } = await request.json()
    if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 })
    const entry = addPlatform(id, platform as PostPlatform, captionOverride)
    return NextResponse.json({ platform: entry }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { platformId, ...updates } = body
    if (!platformId) return NextResponse.json({ error: "platformId required" }, { status: 400 })
    const entry = updatePlatform(platformId, updates)
    return NextResponse.json({ platform: entry })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get("platformId")
    if (!platformId) return NextResponse.json({ error: "platformId required" }, { status: 400 })
    removePlatform(platformId)
    return NextResponse.json({ success: true })
  })
}
