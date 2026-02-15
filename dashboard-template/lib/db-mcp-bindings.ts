// MCP Binding CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"

import type { McpBinding } from "@/types/mcp.types"

interface McpBindingRow {
  id: string
  projectId: string
  serverId: string
  toolId: string | null
  serverName?: string
  toolName?: string
  enabled: number
  rateLimit: number
  createdAt: string
}

function rowToBinding(row: McpBindingRow): McpBinding {
  return { ...row, enabled: row.enabled === 1 } as McpBinding
}

export function getMcpBindings(projectId: string): McpBinding[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT b.*, s.name as serverName, t.name as toolName
    FROM mcp_bindings b
    JOIN mcp_servers s ON s.id = b.serverId
    LEFT JOIN mcp_tools t ON t.id = b.toolId
    WHERE b.projectId = ?
    ORDER BY s.name ASC, t.name ASC
  `).all(projectId) as McpBindingRow[]
  return rows.map(rowToBinding)
}

export function createMcpBinding(input: { projectId: string; serverId: string; toolId?: string; rateLimit?: number }): McpBinding {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO mcp_bindings (id, projectId, serverId, toolId, rateLimit, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, input.projectId, input.serverId, input.toolId || null, input.rateLimit || 0, now)

  const row = db.prepare(`
    SELECT b.*, s.name as serverName, t.name as toolName
    FROM mcp_bindings b
    JOIN mcp_servers s ON s.id = b.serverId
    LEFT JOIN mcp_tools t ON t.id = b.toolId
    WHERE b.id = ?
  `).get(id) as McpBindingRow
  return rowToBinding(row)
}

export function updateMcpBinding(id: string, updates: { enabled?: boolean; rateLimit?: number }): McpBinding | null {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.enabled !== undefined) {
    fields.push("enabled = ?")
    values.push(updates.enabled ? 1 : 0)
  }
  if (updates.rateLimit !== undefined) {
    fields.push("rateLimit = ?")
    values.push(updates.rateLimit)
  }
  if (fields.length === 0) return null

  values.push(id)
  db.prepare(`UPDATE mcp_bindings SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  const row = db.prepare(`
    SELECT b.*, s.name as serverName, t.name as toolName
    FROM mcp_bindings b
    JOIN mcp_servers s ON s.id = b.serverId
    LEFT JOIN mcp_tools t ON t.id = b.toolId
    WHERE b.id = ?
  `).get(id) as McpBindingRow | undefined
  return row ? rowToBinding(row) : null
}

export function deleteMcpBinding(id: string): void {
  const db = getDb()
  db.prepare("DELETE FROM mcp_bindings WHERE id = ?").run(id)
}
