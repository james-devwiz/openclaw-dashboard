import { NextRequest, NextResponse } from "next/server"

import { renameSession, deleteSession } from "@/lib/db-chat"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  try {
    const { title } = await request.json()
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }
    renameSession(id, title.slice(0, 120))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  deleteSession(id)
  return NextResponse.json({ success: true })
}
