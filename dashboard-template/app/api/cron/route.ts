import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"

import { triggerCronJob } from "@/lib/gateway"
import { getCronGoalMap, setCronGoal, removeCronGoal } from "@/lib/db-cron-goals"
import { getDb } from "@/lib/db"

import type { CronJob } from "@/types/index"

export const dynamic = "force-dynamic"

const CRON_JOBS_PATH =
  process.env.OPENCLAW_CRON_PATH || "/root/.openclaw/cron/jobs.json"

interface RawCronJob {
  id: string
  name: string
  enabled: boolean
  schedule: { kind: string; expr?: string; tz?: string; everyMs?: number }
  sessionTarget?: string
  payload: { kind: string; message: string; model: string }
  delivery?: { mode: string; channel: string }
  state: {
    nextRunAtMs: number | null
    lastRunAtMs: number | null
    lastStatus: string | null
    lastDurationMs: number | null
    consecutiveErrors: number
  }
}

function formatSchedule(s: RawCronJob["schedule"]): string {
  if (s.kind === "every" && s.everyMs) {
    const mins = Math.round(s.everyMs / 60000)
    return mins >= 60 ? `every ${mins / 60}h` : `every ${mins}m`
  }
  if (!s.expr) return "unknown"
  return s.tz ? `${s.expr} (${s.tz})` : s.expr
}

function mapJob(raw: RawCronJob): CronJob {
  const lastStatus = raw.state.lastStatus
  const mapped: CronJob["lastStatus"] =
    lastStatus === "ok" ? "success" : lastStatus === "error" ? "failure" : undefined

  return {
    name: raw.name,
    schedule: formatSchedule(raw.schedule),
    model: raw.payload?.model || "default",
    target: raw.delivery ? { channel: raw.delivery.channel } : undefined,
    enabled: raw.enabled,
    lastRun: raw.state.lastRunAtMs ? new Date(raw.state.lastRunAtMs).toISOString() : undefined,
    lastStatus: mapped,
    nextRun: raw.state.nextRunAtMs ? new Date(raw.state.nextRunAtMs).toISOString() : undefined,
    prompt: raw.payload?.message,
    sessionTarget: raw.sessionTarget,
  }
}

function augmentWithGoals(jobs: CronJob[]): CronJob[] {
  const goalMap = getCronGoalMap()
  const goalIds = [...new Set(Object.values(goalMap))]
  if (goalIds.length === 0) return jobs

  const db = getDb()
  const nameMap: Record<string, string> = {}
  for (const id of goalIds) {
    const row = db.prepare("SELECT name FROM goals WHERE id = ?").get(id) as { name: string } | undefined
    if (row) nameMap[id] = row.name
  }

  return jobs.map((job) => {
    const goalId = goalMap[job.name]
    if (!goalId) return job
    return { ...job, goalId, goalName: nameMap[goalId] || "Unknown" }
  })
}

export async function GET() {
  try {
    const raw = await readFile(CRON_JOBS_PATH, "utf-8")
    const data = JSON.parse(raw)
    const rawJobs: RawCronJob[] = data?.jobs || []
    const jobs = augmentWithGoals(rawJobs.filter((j) => j.enabled).map(mapJob))
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Failed to read cron jobs:", error)
    return NextResponse.json({ jobs: [] })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, jobName } = body

  if (action === "trigger" && jobName) {
    try {
      const result = await triggerCronJob(jobName)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Trigger failed" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { cronJobName, goalId } = body

  if (!cronJobName) {
    return NextResponse.json({ error: "cronJobName is required" }, { status: 400 })
  }

  if (goalId) {
    setCronGoal(cronJobName, goalId)
  } else {
    removeCronGoal(cronJobName)
  }

  return NextResponse.json({ ok: true })
}
