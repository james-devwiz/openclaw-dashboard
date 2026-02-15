import { NextRequest, NextResponse } from "next/server"
import { getMcpServers, createMcpServer, updateMcpServer, deleteMcpServer } from "@/lib/db-mcp-servers"
import { syncConfigFromDb } from "@/lib/mcporter"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const includeDisabled = request.nextUrl.searchParams.get("includeDisabled") === "true"
  const servers = getMcpServers(includeDisabled)
  return NextResponse.json({ servers })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { name, url, command, args, transport, authType, env, authConfig, tags } = body

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const server = createMcpServer({ name, url, command, args, transport, authType, env, authConfig, tags })
    await syncConfigFromDb()
    return NextResponse.json({ server }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { serverId, ...updates } = body

    if (!serverId) {
      return NextResponse.json({ error: "serverId is required" }, { status: 400 })
    }

    const server = updateMcpServer(serverId, updates)
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }
    await syncConfigFromDb()
    return NextResponse.json({ server })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteMcpServer(id)
    await syncConfigFromDb()
    return NextResponse.json({ success: true })
  })
}
