// Comment CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Comment } from "@/types"

interface CommentRow {
  id: string
  taskId: string
  content: string
  source: string
  createdAt: string
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    taskId: row.taskId,
    content: row.content,
    source: row.source as "user" | "openclaw",
    createdAt: row.createdAt,
  }
}

export function getComments(taskId: string): Comment[] {
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM comments WHERE taskId = ? ORDER BY createdAt ASC")
    .all(taskId) as CommentRow[]
  return rows.map(rowToComment)
}

export function createComment(input: {
  taskId: string
  content: string
  source?: "user" | "openclaw"
}): Comment {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    "INSERT INTO comments (id, taskId, content, source, createdAt) VALUES (?, ?, ?, ?, ?)"
  ).run(id, input.taskId, input.content, input.source || "user", now)

  const task = db.prepare("SELECT name FROM tasks WHERE id = ?").get(input.taskId) as { name: string } | undefined
  logActivity({
    entityType: "task", entityId: input.taskId,
    entityName: task?.name || "Unknown", action: "updated", detail: "Comment added",
  })

  return rowToComment(db.prepare("SELECT * FROM comments WHERE id = ?").get(id) as CommentRow)
}

export function deleteComment(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT taskId FROM comments WHERE id = ?").get(id) as { taskId: string } | undefined
  db.prepare("DELETE FROM comments WHERE id = ?").run(id)
  if (row) {
    const task = db.prepare("SELECT name FROM tasks WHERE id = ?").get(row.taskId) as { name: string } | undefined
    logActivity({
      entityType: "task", entityId: row.taskId,
      entityName: task?.name || "Unknown", action: "updated", detail: "Comment removed",
    })
  }
}
