import { NextRequest, NextResponse } from "next/server"
import { getProjectSessions, createProjectSession } from "@/lib/db-projects"
import { renameSession, deleteSession } from "@/lib/db-chat"
import { withActivitySource } from "@/lib/activity-source"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const { id } = await params
  const sessions = getProjectSessions(id)
  return NextResponse.json({ sessions })
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return withActivitySource(request, async () => {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const title = body.title || "New chat"
    const session = createProjectSession(id, title)
    return NextResponse.json({ session }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { sessionId, title } = body

    if (!sessionId || !title) {
      return NextResponse.json({ error: "sessionId and title required" }, { status: 400 })
    }

    renameSession(sessionId, title)
    return NextResponse.json({ success: true })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId query param required" }, { status: 400 })
    }

    deleteSession(sessionId)
    return NextResponse.json({ success: true })
  })
}
