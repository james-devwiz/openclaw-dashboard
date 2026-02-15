import { NextRequest, NextResponse } from "next/server"
import { getGoals, createGoal, updateGoal, deleteGoal } from "@/lib/db-goals"
import { getDb } from "@/lib/db"
import { getCronGoalMap } from "@/lib/db-cron-goals"
import { withActivitySource } from "@/lib/activity-source"

export async function GET() {
  const goals = getGoals()

  const db = getDb()
  const taskCounts = db.prepare(
    "SELECT goalId, COUNT(*) as count FROM tasks GROUP BY goalId"
  ).all() as Array<{ goalId: string; count: number }>
  const taskMap: Record<string, number> = {}
  for (const row of taskCounts) taskMap[row.goalId] = row.count

  const cronGoalMap = getCronGoalMap()
  const recurringMap: Record<string, number> = {}
  for (const goalId of Object.values(cronGoalMap)) {
    recurringMap[goalId] = (recurringMap[goalId] || 0) + 1
  }

  const enriched = goals.map((g) => ({
    ...g,
    taskCount: taskMap[g.id] || 0,
    recurringCount: recurringMap[g.id] || 0,
  }))

  return NextResponse.json({ goals: enriched })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { name, description, category, targetDate, metric, targetValue, priority } = body

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const goal = createGoal({ name, description, category, targetDate, metric, targetValue, priority })
    return NextResponse.json({ goal }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { goalId, ...updates } = body

    if (!goalId) {
      return NextResponse.json({ error: "goalId is required" }, { status: 400 })
    }

    const goal = updateGoal(goalId, updates)
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }
    return NextResponse.json({ goal })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteGoal(id)
    return NextResponse.json({ success: true })
  })
}
