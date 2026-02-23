import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSchedulingData, priorityScore, sumEstimatedMinutes, getWeekBounds, updateTaskStatus } from "@/lib/db-tasks"
import { logActivity } from "@/lib/activity-logger"
import { withActivitySource } from "@/lib/activity-source"

import type { Task } from "@/types"

const DEFAULT_WEEKLY_BUDGET = 600 // 10 hours

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const weeklyBudget = parseInt(searchParams.get("weeklyBudget") || "") || DEFAULT_WEEKLY_BUDGET

    const { toBeScheduled, toDoThisWeek } = getSchedulingData()
    const { start: weekStart, end: weekEnd } = getWeekBounds()
    let usedMinutes = sumEstimatedMinutes(toDoThisWeek)

    // Split candidates: dated (this week) first, then undated — both sorted by priority
    const dated = toBeScheduled
      .filter((t) => t.dueDate && t.dueDate >= weekStart && t.dueDate < weekEnd)
      .sort((a, b) => priorityScore(a) - priorityScore(b))
    const undated = toBeScheduled
      .filter((t) => !t.dueDate || t.dueDate < weekStart || t.dueDate >= weekEnd)
      .sort((a, b) => priorityScore(a) - priorityScore(b))
    const candidates = [...dated, ...undated]

    const promoted: Task[] = []
    const demoted: Task[] = []
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)

    // Fill phase — promote candidates that fit within budget
    const remaining: Task[] = []
    for (const task of candidates) {
      const mins = task.estimatedMinutes || 30
      if (usedMinutes + mins <= weeklyBudget) {
        promoteTask(db, task, today, weekStart)
        usedMinutes += mins
        promoted.push(task)
      } else {
        remaining.push(task)
      }
    }

    // Swap phase — check if remaining high-priority tasks should replace lower ones
    const currentWeekTasks = [...toDoThisWeek]
    for (const candidate of remaining) {
      const candidateScore = priorityScore(candidate)
      const candidateMins = candidate.estimatedMinutes || 30

      // Find the lowest-priority task currently scheduled
      const sortedWeek = currentWeekTasks.sort((a, b) => priorityScore(b) - priorityScore(a))
      const weakest = sortedWeek[0]
      if (!weakest) break

      const weakestScore = priorityScore(weakest)
      const weakestMins = weakest.estimatedMinutes || 30

      // Only swap if candidate has genuinely higher priority and fits
      if (candidateScore < weakestScore && usedMinutes - weakestMins + candidateMins <= weeklyBudget) {
        // Demote weakest
        updateTaskStatus(weakest.id, "To Be Scheduled")
        logActivity({
          entityType: "task", entityId: weakest.id, entityName: weakest.name,
          action: "status_changed", detail: "Status: To Do This Week → To Be Scheduled (scheduler swap)",
          source: "cron",
        })
        demoted.push(weakest)
        usedMinutes -= weakestMins
        currentWeekTasks.splice(currentWeekTasks.indexOf(weakest), 1)

        // Promote candidate
        promoteTask(db, candidate, today, weekStart)
        usedMinutes += candidateMins
        promoted.push(candidate)
        currentWeekTasks.push(candidate)
      }
    }

    return NextResponse.json({
      promoted: promoted.length,
      demoted: demoted.length,
      promotedTasks: promoted.map((t) => ({ id: t.id, name: t.name })),
      demotedTasks: demoted.map((t) => ({ id: t.id, name: t.name })),
      weeklyBudget,
      usedMinutes,
      remainingMinutes: weeklyBudget - usedMinutes,
    })
  })
}

function promoteTask(db: ReturnType<typeof getDb>, task: Task, today: string, weekStart: string) {
  const now = new Date().toISOString()
  // Assign today as due date if undated
  const dueDate = task.dueDate && task.dueDate >= weekStart ? task.dueDate : today
  db.prepare("UPDATE tasks SET status = 'To Do This Week', assignee = 'AI Assistant', dueDate = ?, updatedAt = ? WHERE id = ?")
    .run(dueDate, now, task.id)
  logActivity({
    entityType: "task", entityId: task.id, entityName: task.name,
    action: "status_changed", detail: "Status: To Be Scheduled → To Do This Week (daily scheduler)",
    source: "cron",
  })
}
