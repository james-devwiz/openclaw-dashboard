// Heartbeat CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { HeartbeatEvent, HeartbeatStatus, HeartbeatStats } from "@/types"

interface HeartbeatRow {
  id: string
  status: string
  model: string
  duration: number
  summary: string
  detail: string
  triggeredBy: string
  createdAt: string
}

function rowToEvent(row: HeartbeatRow): HeartbeatEvent {
  return {
    id: row.id,
    status: row.status as HeartbeatStatus,
    model: row.model,
    duration: row.duration,
    summary: row.summary,
    detail: row.detail || "",
    triggeredBy: row.triggeredBy as HeartbeatEvent["triggeredBy"],
    createdAt: row.createdAt,
  }
}

export function getHeartbeats(limit = 20, offset = 0): HeartbeatEvent[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM heartbeats ORDER BY createdAt DESC LIMIT ? OFFSET ?").all(limit, offset) as HeartbeatRow[]
  return rows.map(rowToEvent)
}

export function getHeartbeatCount(): number {
  const db = getDb()
  return (db.prepare("SELECT COUNT(*) as c FROM heartbeats").get() as { c: number }).c
}

export function getHeartbeatStats(): HeartbeatStats {
  const db = getDb()
  const total = (db.prepare("SELECT COUNT(*) as c FROM heartbeats").get() as { c: number }).c
  const successCount = (db.prepare("SELECT COUNT(*) as c FROM heartbeats WHERE status = 'success'").get() as { c: number }).c
  const failureCount = (db.prepare("SELECT COUNT(*) as c FROM heartbeats WHERE status = 'failure'").get() as { c: number }).c
  const last = db.prepare("SELECT createdAt FROM heartbeats ORDER BY createdAt DESC LIMIT 1").get() as { createdAt: string } | undefined
  const avg = db.prepare("SELECT AVG(duration) as a FROM heartbeats").get() as { a: number | null }

  return {
    total,
    successCount,
    failureCount,
    lastHeartbeat: last?.createdAt || null,
    avgDuration: Math.round(avg.a || 0),
  }
}

export function createHeartbeat(input: {
  status?: HeartbeatStatus
  model?: string
  duration?: number
  summary: string
  detail?: string
  triggeredBy?: HeartbeatEvent["triggeredBy"]
}): HeartbeatEvent {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO heartbeats (id, status, model, duration, summary, detail, triggeredBy, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.status || "success", input.model || "", input.duration || 0, input.summary, input.detail || "", input.triggeredBy || "heartbeat", now)

  logActivity({ entityType: "heartbeat", entityId: id, entityName: "Heartbeat", action: "created", detail: input.summary })
  return rowToEvent(db.prepare("SELECT * FROM heartbeats WHERE id = ?").get(id) as HeartbeatRow)
}
