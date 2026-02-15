import { NextRequest, NextResponse } from "next/server"
import { getSuggestions, createSuggestion, updateSuggestionStatus, deleteSuggestion } from "@/lib/db-memory-suggestions"
import { createWorkspaceFile, appendWorkspaceFile } from "@/lib/workspace-write"
import { withActivitySource } from "@/lib/activity-source"
import type { SuggestionStatus } from "@/types/memory.types"

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as SuggestionStatus | null
  const suggestions = getSuggestions(status || undefined)
  return NextResponse.json({ suggestions })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const suggestion = createSuggestion(body)
    return NextResponse.json({ suggestion }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id, status, targetFile, content, title, targetCategory } = body as {
      id: string; status: SuggestionStatus; targetFile?: string; content?: string
      title?: string; targetCategory?: string
    }

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 })
    }

    // If approved, write the content to the workspace
    if (status === "approved" && content) {
      try {
        if (targetFile) {
          await appendWorkspaceFile(targetFile, content)
        } else {
          const safeName = (title || "suggestion").replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-")
          const category = targetCategory || "memory"
          const dir = category === "core" ? "" : `${category}/`
          await createWorkspaceFile(`${dir}${safeName}.md`, content)
        }
      } catch (err) {
        console.error("Failed to write suggestion:", err)
        return NextResponse.json({ error: "Failed to write file" }, { status: 500 })
      }
    }

    updateSuggestionStatus(id, status)
    return NextResponse.json({ success: true })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    deleteSuggestion(id)
    return NextResponse.json({ success: true })
  })
}
