import type {
  McpServer, McpTool, McpBinding, McpCallLog,
  CreateMcpServerInput, UpdateMcpServerInput, McpObservabilityStats,
} from "@/types/mcp.types"

const BASE = "/api/mcp"

// --- Servers ---

export async function getMcpServersApi(includeDisabled = false): Promise<McpServer[]> {
  const qs = includeDisabled ? "?includeDisabled=true" : ""
  const res = await fetch(`${BASE}/servers${qs}`)
  if (!res.ok) throw new Error(`Servers fetch failed: ${res.status}`)
  const data = await res.json()
  return data.servers || []
}

export async function createMcpServerApi(input: CreateMcpServerInput): Promise<McpServer> {
  const res = await fetch(`${BASE}/servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create server")
  return (await res.json()).server
}

export async function updateMcpServerApi(id: string, updates: UpdateMcpServerInput): Promise<McpServer> {
  const res = await fetch(`${BASE}/servers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serverId: id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update server")
  return (await res.json()).server
}

export async function deleteMcpServerApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/servers?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete server")
}

export async function testMcpServerApi(id: string): Promise<{ healthy: boolean; message: string }> {
  const res = await fetch(`${BASE}/servers/${id}/health`, { method: "POST" })
  if (!res.ok) throw new Error("Health check failed")
  return res.json()
}

export async function syncMcpToolsApi(id: string): Promise<{ toolCount: number }> {
  const res = await fetch(`${BASE}/servers/${id}/sync`, { method: "POST" })
  if (!res.ok) throw new Error("Sync failed")
  return res.json()
}

// --- Tools ---

export async function getMcpToolsApi(serverId?: string, search?: string): Promise<McpTool[]> {
  const params = new URLSearchParams()
  if (serverId) params.set("serverId", serverId)
  if (search) params.set("search", search)
  const res = await fetch(`${BASE}/tools?${params}`)
  if (!res.ok) throw new Error("Tools fetch failed")
  return (await res.json()).tools || []
}

export async function updateMcpToolApi(id: string, updates: { tags?: string[]; enabled?: boolean }): Promise<McpTool> {
  const res = await fetch(`${BASE}/tools`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolId: id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update tool")
  return (await res.json()).tool
}

export async function callMcpToolApi(toolId: string, params: Record<string, unknown>): Promise<{ result: unknown; latencyMs: number }> {
  const res = await fetch(`${BASE}/tools/${toolId}/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params }),
  })
  if (!res.ok) throw new Error("Tool call failed")
  return res.json()
}

// --- Bindings ---

export async function getMcpBindingsApi(projectId: string): Promise<McpBinding[]> {
  const res = await fetch(`${BASE}/bindings?projectId=${encodeURIComponent(projectId)}`)
  if (!res.ok) throw new Error("Bindings fetch failed")
  return (await res.json()).bindings || []
}

export async function createMcpBindingApi(input: { projectId: string; serverId: string; toolId?: string; rateLimit?: number }): Promise<McpBinding> {
  const res = await fetch(`${BASE}/bindings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create binding")
  return (await res.json()).binding
}

export async function updateMcpBindingApi(id: string, updates: { enabled?: boolean; rateLimit?: number }): Promise<McpBinding> {
  const res = await fetch(`${BASE}/bindings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bindingId: id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update binding")
  return (await res.json()).binding
}

export async function deleteMcpBindingApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/bindings?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete binding")
}

// --- Logs & Stats ---

export async function getMcpCallLogsApi(filter: {
  serverId?: string; toolName?: string; status?: string; limit?: number; offset?: number
}): Promise<{ logs: McpCallLog[]; total: number }> {
  const params = new URLSearchParams()
  if (filter.serverId) params.set("serverId", filter.serverId)
  if (filter.toolName) params.set("toolName", filter.toolName)
  if (filter.status) params.set("status", filter.status)
  if (filter.limit) params.set("limit", String(filter.limit))
  if (filter.offset) params.set("offset", String(filter.offset))
  const res = await fetch(`${BASE}/logs?${params}`)
  if (!res.ok) throw new Error("Logs fetch failed")
  return res.json()
}

export async function getMcpStatsApi(hours = 24): Promise<McpObservabilityStats> {
  const res = await fetch(`${BASE}/stats?hours=${hours}`)
  if (!res.ok) throw new Error("Stats fetch failed")
  return (await res.json()).stats
}
