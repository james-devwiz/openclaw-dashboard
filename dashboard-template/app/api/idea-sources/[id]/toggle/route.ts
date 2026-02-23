import { NextRequest, NextResponse } from "next/server"

import { getIdeaSourceById, updateIdeaSource } from "@/lib/db-idea-sources"
import { toggleIdeaSourceCron } from "@/lib/idea-source-cron"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const source = getIdeaSourceById(id)
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  const newEnabled = !source.enabled

  if (source.cronJobId) {
    try { await toggleIdeaSourceCron(source.cronJobId, newEnabled) } catch (error) { console.error("Failed to toggle idea source cron:", error) }
  }

  const updated = updateIdeaSource(id, { enabled: newEnabled })
  return NextResponse.json({ source: updated })
}
