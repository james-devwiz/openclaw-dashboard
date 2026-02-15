import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"
import { SITE_CONFIG } from "@/lib/site-config"

export async function POST() {
  const db = getDb()

  // Compute next week's Sunday-to-Sunday bounds in local timezone
  const now = new Date()
  const local = new Date(now.getTime() + SITE_CONFIG.utcOffsetHours * 60 * 60 * 1000)
  const day = local.getUTCDay()

  // Next week starts on the coming Sunday
  const nextSunday = new Date(local)
  nextSunday.setUTCDate(local.getUTCDate() + (7 - day))
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
    db.prepare("UPDATE tasks SET status = 'To Do This Week', updatedAt = ? WHERE id = ?").run(updatedAt, task.id)
    logActivity({
      entityType: "task", entityId: task.id, entityName: task.name,
      action: "status_changed", detail: "Status: Backlog → To Do This Week (weekly promotion)",
      source: "cron",
    })
  }

  return NextResponse.json({ promoted: tasks.length, weekStart, weekEnd })
}
