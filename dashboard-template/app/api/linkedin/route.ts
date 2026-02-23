// LinkedIn threads — list + update

import { NextRequest, NextResponse } from "next/server"
import { getThreads, getThreadCount, getThreadById, updateThread, unsnoozeExpiredThreads } from "@/lib/db-linkedin"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || undefined
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") || undefined
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  // Auto-unsnooze expired threads on every list fetch
  unsnoozeExpiredThreads()

  const threads = getThreads({ status, search, category, limit, offset })
  const total = getThreadCount({ status, search, category })
  return NextResponse.json({ threads, total })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { threadId, ...updates } = body

    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    // If archiving, also archive in LinkedIn via Unipile (best-effort)
    if (updates.isArchived === true) {
      const existing = getThreadById(threadId)
      if (existing?.unipileId) {
        archiveInUnipile(existing.unipileId).catch(() => {})
      }
    }

    const thread = updateThread(threadId, updates)
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }
    return NextResponse.json({ thread })
  })
}

async function archiveInUnipile(chatId: string) {
  try {
    const { getUnipile, isUnipileConfigured } = await import("@/lib/unipile")
    if (!isUnipileConfigured()) return
    const client = getUnipile()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client.messaging as any).updateChat(chatId, { archived: true })
  } catch (err) {
    console.error("Unipile archive failed (best-effort):", err)
  }
}
