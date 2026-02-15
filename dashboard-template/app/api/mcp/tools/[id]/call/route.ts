import { NextRequest, NextResponse } from "next/server"
import { getMcpTool } from "@/lib/db-mcp-tools"
import { getMcpServer } from "@/lib/db-mcp-servers"
import { mcporterCall } from "@/lib/mcporter"
import { logMcpCall } from "@/lib/db-mcp-logs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tool = getMcpTool(id)
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 })
  }

  const server = getMcpServer(tool.serverId)
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 })
  }

  const body = await request.json()
  const callParams = body.params || {}

  try {
    const { result, latencyMs } = await mcporterCall(server.name, tool.name, callParams)

    logMcpCall({
      serverId: server.id, toolName: tool.name, status: "success",
      latencyMs, inputSummary: JSON.stringify(callParams).slice(0, 500),
      outputSummary: JSON.stringify(result).slice(0, 500),
    })

    return NextResponse.json({ result, latencyMs })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool call failed"

    logMcpCall({
      serverId: server.id, toolName: tool.name, status: "error",
      latencyMs: 0, inputSummary: JSON.stringify(callParams).slice(0, 500),
      errorMessage: message,
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
