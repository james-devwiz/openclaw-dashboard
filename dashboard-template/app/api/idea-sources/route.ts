import { NextRequest, NextResponse } from "next/server"

import { getIdeaSources, createIdeaSource, deleteIdeaSource, updateIdeaSource, getIdeaCountBySourceType } from "@/lib/db-idea-sources"
import { createIdeaSourceCron, deleteIdeaSourceCron } from "@/lib/idea-source-cron"
import { getCronJobStates } from "@/lib/gateway"
import { withActivitySource } from "@/lib/activity-source"
import type { IdeaSourcePlatform, IdeaSourceFrequency } from "@/types"

const VALID_PLATFORMS: IdeaSourcePlatform[] = ["youtube", "linkedin", "x", "reddit", "website"]
const VALID_FREQUENCIES: IdeaSourceFrequency[] = ["daily", "twice-weekly", "weekly", "fortnightly", "monthly"]

const SOURCE_TYPE_MAP: Record<IdeaSourcePlatform, string> = {
  youtube: "YouTube", linkedin: "Blog", x: "Blog",
  reddit: "Reddit", website: "Blog", email: "Newsletter",
}

export async function GET() {
  const sources = getIdeaSources()

  // Enrich with cron job states (last run, status)
  const cronNames = sources.map((s) => s.cronJobName).filter(Boolean) as string[]
  const cronStates = cronNames.length > 0 ? await getCronJobStates(cronNames) : {}

  // Enrich with idea counts per source type
  const enriched = sources.map((s) => {
    const state = s.cronJobName ? cronStates[s.cronJobName] : undefined
    const sourceType = SOURCE_TYPE_MAP[s.platform] || "Blog"
    return {
      ...s,
      lastRun: state?.lastRunAt,
      lastStatus: state?.lastStatus,
      ideaCount: getIdeaCountBySourceType(sourceType),
    }
  })

  return NextResponse.json({ sources: enriched })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { platform, url, comments, frequency, validationScore, validationSummary, validationDetails } = body

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
    }

    const source = createIdeaSource({ platform, url, comments, frequency, validationScore, validationSummary, validationDetails })

    try {
      const { cronJobId, cronJobName } = await createIdeaSourceCron(source)
      const updated = updateIdeaSource(source.id, { cronJobId, cronJobName })
      return NextResponse.json({ source: updated || source }, { status: 201 })
    } catch (err) {
      console.error("Failed to create cron job:", err)
      return NextResponse.json({ source, warning: "Source created but cron job failed" }, { status: 201 })
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const sources = getIdeaSources()
    const source = sources.find((s) => s.id === id)

    if (source?.cronJobId) {
      try { await deleteIdeaSourceCron(source.cronJobId) } catch (error) { console.error("Failed to delete idea source cron:", error) }
    }

    deleteIdeaSource(id)
    return NextResponse.json({ ok: true })
  })
}
