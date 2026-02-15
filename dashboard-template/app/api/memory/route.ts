import { NextRequest, NextResponse } from "next/server"
import { listWorkspaceFiles, listCategoryFiles, getCategoryCounts, searchWorkspaceFiles, getFileReferences } from "@/lib/workspace"
import { createWorkspaceFile, appendWorkspaceFile } from "@/lib/workspace-write"
import { logActivity } from "@/lib/activity-logger"
import { withActivitySource } from "@/lib/activity-source"
import type { MemoryCategory } from "@/types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") as MemoryCategory | null
  const query = searchParams.get("q")
  const countsOnly = searchParams.get("counts") === "true"
  const refsOnly = searchParams.get("refs") === "true"

  try {
    if (refsOnly) {
      const refs = await getFileReferences()
      return NextResponse.json({ refs })
    }
    if (countsOnly) {
      const counts = await getCategoryCounts()
      return NextResponse.json({ counts })
    }
    if (query) {
      const items = await searchWorkspaceFiles(query)
      return NextResponse.json({ items })
    }
    if (category) {
      const items = await listCategoryFiles(category)
      return NextResponse.json({ items })
    }
    const items = await listWorkspaceFiles()
    return NextResponse.json({ items })
  } catch (err) {
    console.error("Memory fetch error:", err)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    try {
      const body = await request.json()
      const { action, relativePath, content } = body as {
        action: "create" | "append"
        relativePath: string
        content: string
      }

      if (!relativePath || !content) {
        return NextResponse.json({ error: "relativePath and content are required" }, { status: 400 })
      }

      if (action === "append") {
        await appendWorkspaceFile(relativePath, content)
      } else {
        await createWorkspaceFile(relativePath, content)
      }

      logActivity({
        entityType: "memory",
        entityId: relativePath,
        entityName: relativePath,
        action: "created",
        detail: action === "append" ? `Appended to ${relativePath}` : `Created ${relativePath}`,
      })

      return NextResponse.json({ success: true })
    } catch (err) {
      console.error("Memory save error:", err)
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }
  })
}
