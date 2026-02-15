import { NextRequest, NextResponse } from "next/server"
import { getProjectFiles, addProjectFiles, removeProjectFile } from "@/lib/db-projects"
import { readWorkspaceFile } from "@/lib/workspace"
import { withActivitySource } from "@/lib/activity-source"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params
  const files = getProjectFiles(id)

  // Enrich with workspace metadata
  const enriched = await Promise.all(
    files.map(async (f) => {
      const item = await readWorkspaceFile(f.relativePath)
      return {
        ...f,
        title: item?.title || f.relativePath,
        category: item?.category || "unknown",
        excerpt: item?.excerpt || "",
        missing: !item,
      }
    })
  )

  return NextResponse.json({ files: enriched })
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return withActivitySource(request, async () => {
    const { id } = await params
    const body = await request.json()
    const { relativePaths } = body

    if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
      return NextResponse.json({ error: "relativePaths array is required" }, { status: 400 })
    }

    addProjectFiles(id, relativePaths)
    const files = getProjectFiles(id)
    return NextResponse.json({ files }, { status: 201 })
  })
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return withActivitySource(request, async () => {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const encodedPath = searchParams.get("path")

    if (!encodedPath) {
      return NextResponse.json({ error: "path query param is required" }, { status: 400 })
    }

    const relativePath = Buffer.from(encodedPath, "base64url").toString("utf-8")
    removeProjectFile(id, relativePath)
    return NextResponse.json({ success: true })
  })
}
