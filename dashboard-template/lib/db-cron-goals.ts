// Cron job ↔ Goal mapping — links VPS cron jobs to dashboard goals

import { getDb } from "./db"

interface CronGoalRow {
  cronJobName: string
  goalId: string
}

export function getCronGoalMap(): Record<string, string> {
  const db = getDb()
  const rows = db.prepare("SELECT cronJobName, goalId FROM cron_goals").all() as CronGoalRow[]
  const map: Record<string, string> = {}
  for (const row of rows) map[row.cronJobName] = row.goalId
  return map
}

export function setCronGoal(cronJobName: string, goalId: string): void {
  const db = getDb()
  db.prepare(
    "INSERT INTO cron_goals (cronJobName, goalId) VALUES (?, ?) ON CONFLICT(cronJobName) DO UPDATE SET goalId = ?"
  ).run(cronJobName, goalId, goalId)
}

export function removeCronGoal(cronJobName: string): void {
  const db = getDb()
  db.prepare("DELETE FROM cron_goals WHERE cronJobName = ?").run(cronJobName)
}
