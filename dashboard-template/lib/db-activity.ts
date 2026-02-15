// Activity read operations

import { getDb } from "./db"

import type { ActivityItem, ActivityEntityType } from "@/types/activity.types"

interface ActivityRow {
  id: string
  entityType: string
  entityId: string
  entityName: string
  action: string
  detail: string
  changes: string
  source: string
  createdAt: string
}

function rowToActivity(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    entityType: row.entityType as ActivityItem["entityType"],
    entityId: row.entityId,
    entityName: row.entityName,
    action: row.action as ActivityItem["action"],
    detail: row.detail || "",
    changes: row.changes || "",
    source: row.source,
    createdAt: row.createdAt,
  }
}

export function getActivities(filters?: {
  entityType?: ActivityEntityType
  limit?: number
  offset?: number
}): ActivityItem[] {
  const db = getDb()
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0

  if (filters?.entityType) {
    const rows = db
      .prepare("SELECT * FROM activities WHERE entityType = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?")
      .all(filters.entityType, limit, offset) as ActivityRow[]
    return rows.map(rowToActivity)
  }

  const rows = db
    .prepare("SELECT * FROM activities ORDER BY createdAt DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as ActivityRow[]
  return rows.map(rowToActivity)
}

export function getActivitiesByEntity(entityType: ActivityEntityType, entityId: string): ActivityItem[] {
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM activities WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC")
    .all(entityType, entityId) as ActivityRow[]
  return rows.map(rowToActivity)
}

export function getActivityCount(entityType?: ActivityEntityType): number {
  const db = getDb()
  if (entityType) {
    const row = db.prepare("SELECT COUNT(*) as count FROM activities WHERE entityType = ?").get(entityType) as { count: number }
    return row.count
  }
  const row = db.prepare("SELECT COUNT(*) as count FROM activities").get() as { count: number }
  return row.count
}
