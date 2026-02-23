// Chat session & message CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { ChatMessageRow, ChatSession } from "@/types/chat.types"

// --- Sessions ---

export function getSessionsForTopic(topic: string): ChatSession[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT s.id, s.topic, s.title, s.createdAt, s.updatedAt,
              COUNT(m.id) as messageCount
       FROM chat_sessions s
       LEFT JOIN chat_messages m ON m.sessionId = s.id
       WHERE s.topic = ?
       GROUP BY s.id
       ORDER BY s.updatedAt DESC`
    )
    .all(topic) as ChatSession[]
}

export function getLatestSession(topic: string): ChatSession | null {
  const db = getDb()
  return (
    (db
      .prepare("SELECT * FROM chat_sessions WHERE topic = ? ORDER BY updatedAt DESC LIMIT 1")
      .get(topic) as ChatSession | undefined) || null
  )
}

export function createSession(topic: string, title = "New chat"): ChatSession {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    "INSERT INTO chat_sessions (id, topic, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)"
  ).run(id, topic, title, now, now)

  return { id, topic, title, messageCount: 0, createdAt: now, updatedAt: now }
}

export function renameSession(sessionId: string, title: string): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare("UPDATE chat_sessions SET title = ?, updatedAt = ? WHERE id = ?").run(title, now, sessionId)
}

export function deleteSession(sessionId: string): void {
  const db = getDb()
  const session = db.prepare("SELECT topic, title FROM chat_sessions WHERE id = ?").get(sessionId) as
    | { topic: string; title: string }
    | undefined
  if (!session) return

  const count = db
    .prepare("SELECT COUNT(*) as cnt FROM chat_messages WHERE sessionId = ?")
    .get(sessionId) as { cnt: number }

  db.prepare("DELETE FROM chat_messages WHERE sessionId = ?").run(sessionId)
  db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId)

  logActivity({
    entityType: "chat",
    entityId: sessionId,
    entityName: `Chat: ${session.title}`,
    action: "deleted",
    detail: `Deleted session with ${count.cnt} messages from ${session.topic}`,
  })
}

// --- Messages ---

export function getChatMessages(sessionId: string, limit = 100): ChatMessageRow[] {
  const db = getDb()
  return db
    .prepare(
      "SELECT id, topic, sessionId, role, content, attachments, createdAt FROM chat_messages WHERE sessionId = ? ORDER BY createdAt ASC LIMIT ?"
    )
    .all(sessionId, limit) as ChatMessageRow[]
}

export function saveChatMessage(input: {
  topic: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  attachments?: string
}): ChatMessageRow {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    "INSERT INTO chat_messages (id, topic, sessionId, role, content, attachments, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, input.topic, input.sessionId, input.role, input.content, input.attachments || "", now)

  // Auto-title session from first user message
  if (input.role === "user") {
    const msgCount = db
      .prepare("SELECT COUNT(*) as cnt FROM chat_messages WHERE sessionId = ? AND role = 'user'")
      .get(input.sessionId) as { cnt: number }
    if (msgCount.cnt === 1) {
      const title = input.content.slice(0, 60)
      db.prepare("UPDATE chat_sessions SET title = ?, updatedAt = ? WHERE id = ?").run(title, now, input.sessionId)
    }
  }

  // Touch session updatedAt
  db.prepare("UPDATE chat_sessions SET updatedAt = ? WHERE id = ?").run(now, input.sessionId)

  return { id, topic: input.topic, sessionId: input.sessionId, role: input.role, content: input.content, createdAt: now }
}

// --- Unread counts ---

export function getUnreadCounts(): Record<string, number> {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT m.topic, COUNT(*) as count
       FROM chat_messages m
       LEFT JOIN chat_read_cursors c ON c.topic = m.topic
       WHERE m.role = 'assistant'
         AND (c.lastReadAt IS NULL OR m.createdAt > c.lastReadAt)
       GROUP BY m.topic`
    )
    .all() as Array<{ topic: string; count: number }>
  const counts: Record<string, number> = {}
  for (const row of rows) {
    counts[row.topic] = row.count
  }
  return counts
}

export function markTopicRead(topic: string): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    "INSERT INTO chat_read_cursors (topic, lastReadAt) VALUES (?, ?) ON CONFLICT(topic) DO UPDATE SET lastReadAt = ?"
  ).run(topic, now, now)
}

