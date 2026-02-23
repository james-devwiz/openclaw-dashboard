import { NextRequest, NextResponse } from "next/server"
import { getMedia, addMedia, removeMedia } from "@/lib/db-post-media"
import { withActivitySource } from "@/lib/activity-source"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const MEDIA_DIR = "/root/.openclaw/media"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const media = getMedia(id)
  return NextResponse.json({ media })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withActivitySource(request, async () => {
    const { id: postId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const filePath = join(MEDIA_DIR, filename)

    try {
      await mkdir(MEDIA_DIR, { recursive: true })
      await writeFile(filePath, buffer)
    } catch (err) {
      console.error("Media write failed:", err)
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
    }

    const mediaType = file.type.startsWith("video/") ? "video" as const
      : file.type === "application/pdf" ? "document" as const
      : "image" as const

    const media = addMedia({
      postId, mediaType, filename: file.name,
      mimeType: file.type, fileSize: buffer.length, filePath,
    })

    return NextResponse.json({ media }, { status: 201 })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")
    if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 })
    removeMedia(mediaId)
    return NextResponse.json({ success: true })
  })
}
