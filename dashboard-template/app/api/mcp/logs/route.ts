import { NextRequest, NextResponse } from "next/server"
import { getMcpCallLogs } from "@/lib/db-mcp-logs"

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const filter = {
    serverId: sp.get("serverId") || undefined,
    toolName: sp.get("toolName") || undefined,
    status: sp.get("status") || undefined,
    limit: sp.get("limit") ? parseInt(sp.get("limit")!, 10) : 50,
    offset: sp.get("offset") ? parseInt(sp.get("offset")!, 10) : 0,
  }
  const result = getMcpCallLogs(filter)
  return NextResponse.json(result)
}
