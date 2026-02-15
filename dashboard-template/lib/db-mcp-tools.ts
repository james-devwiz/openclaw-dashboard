// MCP Tool CRUD and sync operations

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { McpTool } from "@/types/mcp.types"

interface McpToolRow {
  id: string
  serverId: string
  serverName?: string
  name: string
  description: string
  inputSchema: string
  tags: string
  enabled: number
  lastSynced: string | null
  createdAt: string
  updatedAt: string
}

function rowToTool(row: McpToolRow): McpTool {
  return {
    ...row,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    enabled: row.enabled === 1,
  } as McpTool
}

export function getMcpTools(serverId?: string, search?: string): McpTool[] {
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (serverId) {
    conditions.push("t.serverId = ?")
    params.push(serverId)
  }
  if (search) {
    conditions.push("(t.name LIKE ? OR t.description LIKE ?)")
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const rows = db.prepare(`
    SELECT t.*, s.name as serverName
    FROM mcp_tools t
    JOIN mcp_servers s ON s.id = t.serverId
    ${where}
    ORDER BY s.name ASC, t.name ASC
  `).all(...params) as McpToolRow[]

  return rows.map(rowToTool)
}

export function getMcpTool(id: string): McpTool | null {
  const db = getDb()
  const row = db.prepare(`
    SELECT t.*, s.name as serverName
    FROM mcp_tools t JOIN mcp_servers s ON s.id = t.serverId
    WHERE t.id = ?
  `).get(id) as McpToolRow | undefined
  return row ? rowToTool(row) : null
}

export function syncMcpTools(serverId: string, tools: Array<{ name: string; description: string; inputSchema: string }>): number {
  const db = getDb()
  const now = new Date().toISOString()

  const upsert = db.prepare(`
    INSERT INTO mcp_tools (id, serverId, name, description, inputSchema, lastSynced, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(serverId, name) DO UPDATE SET
      description = excluded.description,
      inputSchema = excluded.inputSchema,
      lastSynced = excluded.lastSynced,
      updatedAt = excluded.updatedAt
  `)

  const tx = db.transaction(() => {
    const toolNames = tools.map((t) => t.name)
    for (const tool of tools) {
      upsert.run(randomUUID(), serverId, tool.name, tool.description, tool.inputSchema, now, now, now)
    }
    // Remove tools no longer reported by the server
    if (toolNames.length > 0) {
      const placeholders = toolNames.map(() => "?").join(",")
      db.prepare(`DELETE FROM mcp_tools WHERE serverId = ? AND name NOT IN (${placeholders})`).run(serverId, ...toolNames)
    } else {
      db.prepare("DELETE FROM mcp_tools WHERE serverId = ?").run(serverId)
    }
  })
  tx()

  // Update tool count on server
  const count = (db.prepare("SELECT COUNT(*) as cnt FROM mcp_tools WHERE serverId = ?").get(serverId) as { cnt: number }).cnt
  db.prepare("UPDATE mcp_servers SET toolCount = ?, updatedAt = ? WHERE id = ?").run(count, now, serverId)

  return count
}

export function updateMcpTool(id: string, updates: { tags?: string[]; enabled?: boolean }): McpTool | null {
  const db = getDb()
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.tags !== undefined) {
    fields.push("tags = ?")
    values.push(updates.tags.join(","))
  }
  if (updates.enabled !== undefined) {
    fields.push("enabled = ?")
    values.push(updates.enabled ? 1 : 0)
  }
  if (fields.length === 0) return getMcpTool(id)

  fields.push("updatedAt = ?")
  values.push(now, id)
  db.prepare(`UPDATE mcp_tools SET ${fields.join(", ")} WHERE id = ?`).run(...values)
  return getMcpTool(id)
}
