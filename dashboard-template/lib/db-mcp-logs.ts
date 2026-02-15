// MCP call log operations

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { McpCallLog, McpCallStatus, McpObservabilityStats } from "@/types/mcp.types"

export function logMcpCall(input: {
  serverId: string
  toolName: string
  projectId?: string
  status: McpCallStatus
  latencyMs: number
  inputSummary?: string
  outputSummary?: string
  errorMessage?: string
}): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO mcp_call_logs (id, serverId, toolName, projectId, status, latencyMs, inputSummary, outputSummary, errorMessage, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(), input.serverId, input.toolName, input.projectId || null,
    input.status, input.latencyMs, input.inputSummary || "", input.outputSummary || "",
    input.errorMessage || "", new Date().toISOString(),
  )
}

export function getMcpCallLogs(filter: {
  serverId?: string; toolName?: string; status?: string; limit?: number; offset?: number
}): { logs: McpCallLog[]; total: number } {
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.serverId) {
    conditions.push("l.serverId = ?")
    params.push(filter.serverId)
  }
  if (filter.toolName) {
    conditions.push("l.toolName = ?")
    params.push(filter.toolName)
  }
  if (filter.status) {
    conditions.push("l.status = ?")
    params.push(filter.status)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM mcp_call_logs l ${where}`).get(...params) as { cnt: number }).cnt

  const limit = filter.limit || 50
  const offset = filter.offset || 0
  const rows = db.prepare(`
    SELECT l.*, s.name as serverName
    FROM mcp_call_logs l
    JOIN mcp_servers s ON s.id = l.serverId
    ${where}
    ORDER BY l.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as McpCallLog[]

  return { logs: rows, total }
}

export function getMcpObservabilityStats(hours = 24): McpObservabilityStats {
  const db = getDb()
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const totals = db.prepare(`
    SELECT COUNT(*) as totalCalls,
           ROUND(AVG(latencyMs), 0) as avgLatencyMs,
           ROUND(SUM(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) / MAX(COUNT(*), 1) * 100, 1) as successRate
    FROM mcp_call_logs WHERE createdAt >= ?
  `).get(since) as { totalCalls: number; avgLatencyMs: number; successRate: number }

  const callsByServer = db.prepare(`
    SELECT s.name as serverName, COUNT(*) as count
    FROM mcp_call_logs l JOIN mcp_servers s ON s.id = l.serverId
    WHERE l.createdAt >= ?
    GROUP BY l.serverId ORDER BY count DESC
  `).all(since) as Array<{ serverName: string; count: number }>

  const callsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM mcp_call_logs WHERE createdAt >= ?
    GROUP BY status
  `).all(since) as Array<{ status: McpCallStatus; count: number }>

  const recentErrors = db.prepare(`
    SELECT l.*, s.name as serverName
    FROM mcp_call_logs l JOIN mcp_servers s ON s.id = l.serverId
    WHERE l.createdAt >= ? AND l.status != 'success'
    ORDER BY l.createdAt DESC LIMIT 10
  `).all(since) as McpCallLog[]

  return {
    totalCalls: totals.totalCalls,
    successRate: totals.successRate || 0,
    avgLatencyMs: totals.avgLatencyMs || 0,
    callsByServer,
    callsByStatus,
    recentErrors,
  }
}

export function cleanupOldMcpLogs(days = 30): number {
  const db = getDb()
  const result = db.prepare(`DELETE FROM mcp_call_logs WHERE createdAt < datetime('now', '-' || ? || ' days')`).run(days)
  return result.changes
}
