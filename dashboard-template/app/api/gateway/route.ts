import { NextResponse } from "next/server"

import { getGatewayConfig } from "@/lib/gateway"

export const dynamic = "force-dynamic"

export async function GET() {
  const config = await getGatewayConfig()
  return NextResponse.json(config)
}
