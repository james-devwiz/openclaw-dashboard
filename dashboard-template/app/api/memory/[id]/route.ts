import { NextRequest, NextResponse } from "next/server"
import { readWorkspaceFile } from "@/lib/workspace"
import { writeWorkspaceFile } from "@/lib/workspace-write"
import { commitFile } from "@/lib/workspace-git"
import { logActivity } from "@/lib/activity-logger"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const relativePath = Buffer.from(id, "base64url").toString("utf-8")
  const item = await readWorkspaceFile(relativePath)

  if (!item) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  return NextResponse.json({ item })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  return withActivitySource(request, async () => {
    const relativePath = Buffer.from(id, "base64url").toString("utf-8")
    const body = await request.json()
    const { content } = body as { content: string }

    if (typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    try {
      await writeWorkspaceFile(relativePath, content)
      logActivity({
        entityType: "memory",
        entityId: id,
        entityName: relativePath,
        action: "updated",
        detail: `Edited workspace file ${relativePath}`,
      })
      // Auto-commit for version history (non-fatal)
      commitFile(relativePath, `Edited ${relativePath} via dashboard`)
      const item = await readWorkspaceFile(relativePath)
      return NextResponse.json({ item })
    } catch (err) {
      console.error("Memory write error:", err)
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
    }
  })
}
