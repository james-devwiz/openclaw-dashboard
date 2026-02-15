import { NextResponse } from "next/server"
import { getMcpServer } from "@/lib/db-mcp-servers"
import { syncMcpTools } from "@/lib/db-mcp-tools"
import { mcporterListTools } from "@/lib/mcporter"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const server = getMcpServer(id)
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 })
  }

  const tools = await mcporterListTools(server.name)
  const toolCount = syncMcpTools(id, tools)

  return NextResponse.json({ toolCount })
}
