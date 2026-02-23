import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"

import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource, TaskAssignee } from "@/types"

interface TaskRow {
  id: string; name: string; description: string; status: string
  priority: string; category: string; dueDate: string | null
  source: string; goalId: string | null; createdAt: string; updatedAt: string
}

export async function POST() {
  const db = getDb()

  // Select top-priority "To Do This Week" task (High > Medium > Low, then earliest dueDate)
  const task = db.prepare(
    `SELECT * FROM tasks WHERE status = 'To Do This Week'
     ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END,
     dueDate ASC NULLS LAST LIMIT 1`
  ).get() as TaskRow | undefined

  if (!task) {
    return NextResponse.json({ task: null, message: "No tasks available for pickup" })
  }

  const now = new Date().toISOString()
  db.prepare("UPDATE tasks SET status = 'In Progress', assignee = 'AI Assistant', updatedAt = ? WHERE id = ?").run(now, task.id)
  logActivity({
    entityType: "task", entityId: task.id, entityName: task.name,
    action: "status_changed", detail: "Status: To Do This Week → In Progress (AI pickup)",
    source: "cron",
  })

  const result: Task = {
    id: task.id,
    name: task.name,
    description: task.description || undefined,
    status: "In Progress" as TaskStatus,
    priority: task.priority as TaskPriority,
    category: task.category as TaskCategory,
    dueDate: task.dueDate || undefined,
    source: task.source as TaskSource,
    assignee: "AI Assistant",
    goalId: task.goalId || "general",
    createdAt: task.createdAt,
    updatedAt: now,
  }

  return NextResponse.json({ task: result })
}
