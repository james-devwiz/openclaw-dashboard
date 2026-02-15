import { NextRequest, NextResponse } from "next/server"
import { getMcpTools, updateMcpTool } from "@/lib/db-mcp-tools"

export async function GET(request: NextRequest) {
  const serverId = request.nextUrl.searchParams.get("serverId") || undefined
  const search = request.nextUrl.searchParams.get("search") || undefined
  const tools = getMcpTools(serverId, search)
  return NextResponse.json({ tools })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { toolId, ...updates } = body

  if (!toolId) {
    return NextResponse.json({ error: "toolId is required" }, { status: 400 })
  }

  const tool = updateMcpTool(toolId, updates)
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 })
  }
  return NextResponse.json({ tool })
}
