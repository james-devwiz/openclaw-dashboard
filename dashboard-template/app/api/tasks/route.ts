import { NextRequest, NextResponse } from "next/server"
import { getTasks, createTask, updateTaskStatus, updateTask, deleteTask, getTaskStats } from "@/lib/db-tasks"
import { getDb } from "@/lib/db"
import { withActivitySource } from "@/lib/activity-source"
import type { Task, TaskStatus } from "@/types"

interface ApprovalLookupRow { relatedTaskId: string; id: string; status: string }

function augmentTasksWithApprovals(tasks: Task[]): Task[] {
  if (tasks.length === 0) return tasks
  const db = getDb()
  const rows = db.prepare(
    "SELECT relatedTaskId, id, status FROM approvals WHERE relatedTaskId IS NOT NULL"
  ).all() as ApprovalLookupRow[]

  const approvalMap = new Map(rows.map((r) => [r.relatedTaskId, { id: r.id, status: r.status }]))
  return tasks.map((t) => {
    const approval = approvalMap.get(t.id)
    if (approval) return { ...t, approvalId: approval.id, approvalStatus: approval.status as Task["approvalStatus"] }
    return t
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get("stats") === "true") {
    const category = searchParams.get("category") || undefined
    const stats = getTaskStats(category)
    return NextResponse.json({ stats })
  }

  const goalId = searchParams.get("goalId") || undefined
  const category = searchParams.get("category") || undefined
  let tasks = getTasks(goalId)
  if (category) {
    tasks = tasks.filter((t) => t.category === category)
  }
  return NextResponse.json({ tasks: augmentTasksWithApprovals(tasks) })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { name, description, status, priority, category, dueDate, source, goalId, complexity, estimatedMinutes, assignee } = body

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const task = createTask({ name, description, status, priority, category, dueDate, source, goalId, complexity, estimatedMinutes, assignee })
    return NextResponse.json({ task }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { taskId, status, ...updates } = body as {
      taskId: string
      status?: TaskStatus
      [key: string]: unknown
    }

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 })
    }

    if (status && Object.keys(updates).length === 0) {
      const result = updateTaskStatus(taskId, status)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 422 })
      return NextResponse.json({ success: true })
    }

    const task = updateTask(taskId, { status, ...updates })
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    if ("error" in task) return NextResponse.json({ error: task.error }, { status: 422 })
    return NextResponse.json({ task })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("id")

    if (!taskId) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteTask(taskId)
    return NextResponse.json({ success: true })
  })
}
