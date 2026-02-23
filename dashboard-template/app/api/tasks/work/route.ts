import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

import type { TaskComplexity } from "@/types"

interface TaskRow {
  id: string; name: string; description: string; status: string
  priority: string; category: string; dueDate: string | null
  source: string; complexity: string | null; estimatedMinutes: number | null
  assignee: string | null; goalId: string | null; createdAt: string; updatedAt: string
}

interface WorkTask {
  id: string; name: string; description?: string; priority: string
  complexity: TaskComplexity; estimatedMinutes?: number; assignee?: string
  goalName?: string; dueDate?: string; useOpus: boolean
  comments: Array<{ content: string; source: string; createdAt: string }>
}

function buildWorkTask(db: ReturnType<typeof getDb>, row: TaskRow): WorkTask {
  const goalRow = row.goalId
    ? db.prepare("SELECT name FROM goals WHERE id = ?").get(row.goalId) as { name: string } | undefined
    : undefined

  const comments = db.prepare(
    "SELECT content, source, createdAt FROM comments WHERE taskId = ? ORDER BY createdAt DESC LIMIT 5"
  ).all(row.id) as Array<{ content: string; source: string; createdAt: string }>

  const complexity = (row.complexity as TaskComplexity) || "Moderate"
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    priority: row.priority,
    complexity,
    estimatedMinutes: row.estimatedMinutes || undefined,
    assignee: row.assignee || undefined,
    goalName: goalRow?.name,
    dueDate: row.dueDate || undefined,
    useOpus: complexity === "Complex",
    comments,
  }
}

export async function GET() {
  const db = getDb()

  const inProgressRows = db.prepare(
    `SELECT * FROM tasks WHERE status = 'In Progress'
     ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END`
  ).all() as TaskRow[]

  const inProgress = inProgressRows.map((row) => buildWorkTask(db, row))

  let nextPickup: WorkTask | null = null
  if (inProgress.length === 0) {
    const topTask = db.prepare(
      `SELECT * FROM tasks WHERE status = 'To Do This Week'
       ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END,
       dueDate ASC NULLS LAST LIMIT 1`
    ).get() as TaskRow | undefined
    if (topTask) nextPickup = buildWorkTask(db, topTask)
  }

  return NextResponse.json({ inProgress, nextPickup })
}
