import { NextResponse } from "next/server"

import { getGatewayHealth, getSystemResources } from "@/lib/gateway"

export const dynamic = "force-dynamic"

export async function GET() {
  const [health, resources] = await Promise.all([
    getGatewayHealth(),
    getSystemResources(),
  ])
  return NextResponse.json({
    ...health,
    system: {
      cpu: Math.min(Math.round(resources.cpu * 100), 100),
      memory: resources.memory.percent,
      disk: resources.disk.percent,
    },
  })
}
