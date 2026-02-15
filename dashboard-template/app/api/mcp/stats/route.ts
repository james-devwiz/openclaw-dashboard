import { NextRequest, NextResponse } from "next/server"
import { getMcpObservabilityStats } from "@/lib/db-mcp-logs"

export async function GET(request: NextRequest) {
  const hours = parseInt(request.nextUrl.searchParams.get("hours") || "24", 10)
  const stats = getMcpObservabilityStats(hours)
  return NextResponse.json({ stats })
}
