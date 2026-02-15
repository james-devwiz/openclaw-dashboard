// MCP Server CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { McpServer, CreateMcpServerInput, UpdateMcpServerInput, McpServerStatus } from "@/types/mcp.types"

interface McpServerRow {
  id: string
  name: string
  transport: string
  url: string
  command: string
  args: string
  env: string
  authType: string
  authConfig: string
  enabled: number
  status: string
  statusMessage: string
  tags: string
  lastHealthCheck: string | null
  toolCount: number
  createdAt: string
  updatedAt: string
}

function rowToServer(row: McpServerRow): McpServer {
  return {
    ...row,
    env: row.env ? JSON.parse(row.env) : {},
    authConfig: row.authConfig ? JSON.parse(row.authConfig) : {},
    enabled: row.enabled === 1,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
  } as McpServer
}

export function getMcpServers(includeDisabled = false): McpServer[] {
  const db = getDb()
  const where = includeDisabled ? "" : "WHERE enabled = 1"
  const rows = db.prepare(`SELECT * FROM mcp_servers ${where} ORDER BY name ASC`).all() as McpServerRow[]
  return rows.map(rowToServer)
}

export function getMcpServer(id: string): McpServer | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM mcp_servers WHERE id = ?").get(id) as McpServerRow | undefined
  return row ? rowToServer(row) : null
}

export function createMcpServer(input: CreateMcpServerInput): McpServer {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO mcp_servers (id, name, transport, url, command, args, env, authType, authConfig, enabled, status, tags, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'unknown', ?, ?, ?)
  `).run(
    id, input.name, input.transport || "stdio", input.url || "", input.command || "",
    input.args || "", input.env ? JSON.stringify(input.env) : "",
    input.authType || "none", input.authConfig ? JSON.stringify(input.authConfig) : "",
    input.tags ? input.tags.join(",") : "", now, now,
  )

  logActivity({ entityType: "mcp", entityId: id, entityName: input.name, action: "created" })
  return getMcpServer(id)!
}

export function updateMcpServer(id: string, updates: UpdateMcpServerInput): McpServer | null {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM mcp_servers WHERE id = ?").get(id) as McpServerRow | undefined
  if (!existing) return null

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    if (key === "env" || key === "authConfig") {
      fields.push(`${key} = ?`)
      values.push(JSON.stringify(value))
    } else if (key === "tags") {
      fields.push(`${key} = ?`)
      values.push((value as string[]).join(","))
    } else if (key === "enabled") {
      fields.push(`${key} = ?`)
      values.push(value ? 1 : 0)
    } else {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  }
  if (fields.length === 0) return getMcpServer(id)

  fields.push("updatedAt = ?")
  values.push(now, id)

  db.prepare(`UPDATE mcp_servers SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  logActivity({
    entityType: "mcp", entityId: id,
    entityName: updates.name || existing.name, action: "updated",
    detail: Object.keys(updates).join(", "),
  })

  return getMcpServer(id)
}

export function deleteMcpServer(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT name FROM mcp_servers WHERE id = ?").get(id) as { name: string } | undefined
  if (!row) return

  db.prepare("DELETE FROM mcp_servers WHERE id = ?").run(id)
  logActivity({ entityType: "mcp", entityId: id, entityName: row.name, action: "deleted" })
}

export function updateMcpServerStatus(id: string, status: McpServerStatus, message?: string): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    "UPDATE mcp_servers SET status = ?, statusMessage = ?, lastHealthCheck = ?, updatedAt = ? WHERE id = ?"
  ).run(status, message || "", now, now, id)
}
