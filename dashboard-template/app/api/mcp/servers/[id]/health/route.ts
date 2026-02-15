import { NextResponse } from "next/server"
import { getMcpServer, updateMcpServerStatus } from "@/lib/db-mcp-servers"
import { mcporterTestConnection } from "@/lib/mcporter"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const server = getMcpServer(id)
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 })
  }

  const result = await mcporterTestConnection(server.name)
  updateMcpServerStatus(id, result.healthy ? "healthy" : "failing", result.message)

  return NextResponse.json({ healthy: result.healthy, message: result.message })
}
