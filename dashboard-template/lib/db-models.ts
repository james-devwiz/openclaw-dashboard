// Model preferences — dashboard-local disabled state (not stored in openclaw.json)

import { getDb } from "./db"

export function getDisabledModelIds(): Set<string> {
  const db = getDb()
  const rows = db
    .prepare("SELECT modelId FROM model_preferences WHERE disabled = 1")
    .all() as Array<{ modelId: string }>
  return new Set(rows.map((r) => r.modelId))
}

export function setModelDisabled(modelId: string, disabled: boolean): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO model_preferences (modelId, disabled, updatedAt)
     VALUES (?, ?, ?)
     ON CONFLICT(modelId) DO UPDATE SET disabled = excluded.disabled, updatedAt = excluded.updatedAt`
  ).run(modelId, disabled ? 1 : 0, now)
}
