import { NextRequest, NextResponse } from "next/server"
import { getActivitiesByEntity } from "@/lib/db-activity"
import type { ActivityEntityType } from "@/types/activity.types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get("entityType") as ActivityEntityType | null
  const entityId = searchParams.get("entityId")

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 })
  }

  const items = getActivitiesByEntity(entityType, entityId)
  return NextResponse.json({ items })
}
