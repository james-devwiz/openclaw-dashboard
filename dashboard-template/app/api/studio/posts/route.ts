import { NextRequest, NextResponse } from "next/server"
import { getPosts, createPost, updatePost } from "@/lib/db-posts"
import { withActivitySource } from "@/lib/activity-source"
import type { PostStage } from "@/types/studio.types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get("stage") || undefined
  const format = searchParams.get("format") || undefined
  const posts = getPosts(stage, format)
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }
    const post = createPost(body)
    return NextResponse.json({ post }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Stage-only update (drag-and-drop)
    if (updates.stage && Object.keys(updates).length === 1) {
      const post = updatePost(id, { stage: updates.stage as PostStage })
      return NextResponse.json({ post })
    }

    const post = updatePost(id, updates)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    return NextResponse.json({ post })
  })
}
