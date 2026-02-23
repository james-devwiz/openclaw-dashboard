// mcporter bridge — wraps CLI commands with execFile (no shell injection)

import { execFile } from "child_process"
import { promisify } from "util"
import { writeFile, mkdir, chmod } from "fs/promises"
import { dirname } from "path"

import type { McpServer } from "@/types/mcp.types"

const exec = promisify(execFile)
const BIN = "/usr/bin/mcporter"
const CONFIG = "/root/.mcporter/mcporter.json"

interface McpToolSchema {
  name: string
  description: string
  inputSchema: string
}

/** List all configured servers */
export async function mcporterListServers(): Promise<Array<{ name: string; status: string }>> {
  try {
    const { stdout } = await exec(BIN, ["list", "--json"], { timeout: 10000 })
    return JSON.parse(stdout)
  } catch (error) {
    console.error("mcporter list servers failed:", error)
    return []
  }
}

/** List tools for a specific server (with schemas) */
export async function mcporterListTools(server: string): Promise<McpToolSchema[]> {
  try {
    const { stdout } = await exec(BIN, ["list", server, "--schema", "--json"], { timeout: 30000 })
    const parsed = JSON.parse(stdout)
    // mcporter wraps tools inside a server object: { tools: [...] }
    const tools = Array.isArray(parsed) ? parsed : (parsed.tools || [])
    return tools.map((t: Record<string, unknown>) => ({
      name: String(t.name || ""),
      description: String(t.description || ""),
      inputSchema: typeof t.inputSchema === "string" ? t.inputSchema : JSON.stringify(t.inputSchema || {}),
    }))
  } catch (error) {
    console.error(`mcporter list tools for ${server} failed:`, error)
    return []
  }
}

/** Call a tool on a server */
export async function mcporterCall(
  server: string, tool: string, params: Record<string, unknown>
): Promise<{ result: unknown; latencyMs: number }> {
  const start = Date.now()
  const { stdout } = await exec(
    BIN, ["call", `${server}.${tool}`, "--args", JSON.stringify(params)],
    { timeout: 60000 }
  )
  const latencyMs = Date.now() - start
  try {
    return { result: JSON.parse(stdout), latencyMs }
  } catch {
    return { result: stdout.trim(), latencyMs }
  }
}

/** Test connection to a server */
export async function mcporterTestConnection(server: string): Promise<{ healthy: boolean; message: string }> {
  try {
    const { stdout } = await exec(BIN, ["list", server, "--json"], { timeout: 15000 })
    const parsed = JSON.parse(stdout)
    const status = parsed.status || "unknown"
    return { healthy: status === "ok", message: status === "ok" ? "Connection successful" : `Status: ${status}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed"
    return { healthy: false, message: msg }
  }
}

/** Check daemon status */
export async function mcporterDaemonStatus(): Promise<{ running: boolean }> {
  try {
    const { stdout } = await exec(BIN, ["daemon", "status"], { timeout: 5000 })
    return { running: stdout.toLowerCase().includes("running") }
  } catch (error) {
    console.error("mcporter daemon status check failed:", error)
    return { running: false }
  }
}

/** Restart daemon */
export async function mcporterDaemonRestart(): Promise<void> {
  await exec(BIN, ["daemon", "restart"], { timeout: 10000 })
}

/** Generate mcporter.json config from DB state and restart daemon */
export async function generateMcporterConfig(servers: McpServer[]): Promise<void> {
  const config: Record<string, Record<string, unknown>> = {}

  for (const server of servers) {
    if (!server.enabled) continue
    const entry: Record<string, unknown> = {}

    if (server.transport === "stdio") {
      if (server.command) entry.command = server.command
      if (server.args) {
        try { entry.args = JSON.parse(server.args) }
        catch { entry.args = server.args.split(/\s+/).filter(Boolean) }
      }
    } else {
      if (server.url) entry.url = server.url
    }

    if (server.transport !== "stdio") entry.transport = server.transport
    if (Object.keys(server.env).length > 0) entry.env = server.env

    config[server.name] = entry
  }

  await mkdir(dirname(CONFIG), { recursive: true })
  await writeFile(CONFIG, JSON.stringify({ mcpServers: config }, null, 2), "utf-8")
  await chmod(CONFIG, 0o600)

  try {
    await mcporterDaemonRestart()
  } catch {
    // Daemon may not be running; config is still written
  }
}

/** Convenience: read all enabled servers from DB and regenerate config */
export async function syncConfigFromDb(): Promise<void> {
  // Import here to avoid circular dependency
  const { getMcpServers } = await import("./db-mcp-servers")
  const servers = getMcpServers(true)
  await generateMcporterConfig(servers)
}
