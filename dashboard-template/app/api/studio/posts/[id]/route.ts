import { NextRequest, NextResponse } from "next/server"
import { getPostById, updatePost, deletePost } from "@/lib/db-posts"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPostById(id)
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ post })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withActivitySource(request, async () => {
    const { id } = await params
    const updates = await request.json()
    const post = updatePost(id, updates)
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ post })
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withActivitySource(request, async () => {
    const { id } = await params
    deletePost(id)
    return NextResponse.json({ success: true })
  })
}
