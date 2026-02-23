// LinkedIn score history — persist WAMP scores per thread

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { ScoreHistoryEntry, WampV2Score, WampBand } from "@/types"

interface ScoreRow {
  id: string; threadId: string; total: number
  band: string; scoreData: string; createdAt: string
}

function rowToEntry(r: ScoreRow): ScoreHistoryEntry {
  let scoreData: WampV2Score = {} as WampV2Score
  try { scoreData = JSON.parse(r.scoreData) } catch { /* empty */ }
  return {
    id: r.id, threadId: r.threadId, total: r.total,
    band: r.band as WampBand, scoreData, createdAt: r.createdAt,
  }
}

export function saveScoreHistory(threadId: string, scoreData: WampV2Score): ScoreHistoryEntry {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO linkedin_score_history (id, threadId, total, band, scoreData, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, threadId, scoreData.total, scoreData.band, JSON.stringify(scoreData), now)
  return rowToEntry(db.prepare("SELECT * FROM linkedin_score_history WHERE id = ?").get(id) as ScoreRow)
}

export function getScoreHistory(threadId: string, limit = 20): ScoreHistoryEntry[] {
  const db = getDb()
  const rows = db.prepare(
    "SELECT * FROM linkedin_score_history WHERE threadId = ? ORDER BY createdAt DESC LIMIT ?"
  ).all(threadId, limit) as ScoreRow[]
  return rows.map(rowToEntry)
}
