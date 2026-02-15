import { NextRequest, NextResponse } from "next/server"
import { getMcpBindings, createMcpBinding, updateMcpBinding, deleteMcpBinding } from "@/lib/db-mcp-bindings"

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }
  const bindings = getMcpBindings(projectId)
  return NextResponse.json({ bindings })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, serverId, toolId, rateLimit } = body

  if (!projectId || !serverId) {
    return NextResponse.json({ error: "projectId and serverId are required" }, { status: 400 })
  }

  try {
    const binding = createMcpBinding({ projectId, serverId, toolId, rateLimit })
    return NextResponse.json({ binding }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create binding"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { bindingId, ...updates } = body

  if (!bindingId) {
    return NextResponse.json({ error: "bindingId is required" }, { status: 400 })
  }

  const binding = updateMcpBinding(bindingId, updates)
  if (!binding) {
    return NextResponse.json({ error: "Binding not found" }, { status: 404 })
  }
  return NextResponse.json({ binding })
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 })
  }

  deleteMcpBinding(id)
  return NextResponse.json({ success: true })
}
