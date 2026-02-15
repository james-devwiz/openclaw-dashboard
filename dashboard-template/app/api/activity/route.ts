import { NextRequest, NextResponse } from "next/server"

import { getActivities, getActivityCount } from "@/lib/db-activity"

import type { ActivityEntityType } from "@/types/activity.types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const entityType = params.get("entityType") as ActivityEntityType | null
  const limit = parseInt(params.get("limit") || "50", 10)
  const offset = parseInt(params.get("offset") || "0", 10)

  const items = getActivities({
    entityType: entityType || undefined,
    limit,
    offset,
  })
  const total = getActivityCount(entityType || undefined)

  return NextResponse.json({ items, total })
}
