// Activity logger — called by CRUD functions after mutations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { getActivitySource } from "./activity-source"

import type { ActivitySource } from "./activity-source"
import type { ActivityEntityType, ActivityAction } from "@/types/activity.types"

export function logActivity(input: {
  entityType: ActivityEntityType
  entityId: string
  entityName: string
  action: ActivityAction
  detail?: string
  changes?: Record<string, [unknown, unknown]>
  source?: ActivitySource
}): void {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO activities (id, entityType, entityId, entityName, action, detail, changes, source, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.entityType,
    input.entityId,
    input.entityName,
    input.action,
    input.detail || "",
    input.changes ? JSON.stringify(input.changes) : "",
    input.source || getActivitySource(),
    now
  )
}
