import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"

export async function POST() {
  const db = getDb()

  // Compute next week's Sunday-to-Sunday bounds (AEST = UTC+10)
  const now = new Date()
  const aest = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const day = aest.getUTCDay()

  // Next week starts on the coming Sunday
  const nextSunday = new Date(aest)
  nextSunday.setUTCDate(aest.getUTCDate() + (7 - day))
  nextSunday.setUTCHours(0, 0, 0, 0)
  const nextSundayEnd = new Date(nextSunday)
  nextSundayEnd.setUTCDate(nextSunday.getUTCDate() + 7)

  const weekStart = nextSunday.toISOString().slice(0, 10)
  const weekEnd = nextSundayEnd.toISOString().slice(0, 10)

  // Select Backlog tasks with dueDate in next week's range
  const tasks = db.prepare(
    `SELECT id, name FROM tasks WHERE status = 'Backlog' AND dueDate >= ? AND dueDate < ?`
  ).all(weekStart, weekEnd) as Array<{ id: string; name: string }>

  const updatedAt = now.toISOString()
  for (const task of tasks) {
    db.prepare("UPDATE tasks SET status = 'To Be Scheduled', assignee = 'AI Assistant', updatedAt = ? WHERE id = ?").run(updatedAt, task.id)
    logActivity({
      entityType: "task", entityId: task.id, entityName: task.name,
      action: "status_changed", detail: "Status: Backlog → To Be Scheduled (weekly promotion)",
      source: "cron",
    })
  }

  return NextResponse.json({ promoted: tasks.length, weekStart, weekEnd })
}
