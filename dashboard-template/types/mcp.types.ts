export type McpTransport = "stdio" | "http" | "sse"
export type McpAuthType = "none" | "api_key" | "bearer" | "oauth2"
export type McpServerStatus = "healthy" | "failing" | "disabled" | "unknown"
export type McpCallStatus = "success" | "error" | "timeout"

export interface McpServer {
  id: string
  name: string
  transport: McpTransport
  url: string
  command: string
  args: string
  env: Record<string, string>
  authType: McpAuthType
  authConfig: Record<string, string>
  enabled: boolean
  status: McpServerStatus
  statusMessage: string
  tags: string[]
  lastHealthCheck: string | null
  toolCount: number
  createdAt: string
  updatedAt: string
}

export interface McpTool {
  id: string
  serverId: string
  serverName?: string
  name: string
  description: string
  inputSchema: string
  tags: string[]
  enabled: boolean
  lastSynced: string | null
  createdAt: string
  updatedAt: string
}

export interface McpBinding {
  id: string
  projectId: string
  serverId: string
  toolId: string | null
  serverName?: string
  toolName?: string
  enabled: boolean
  rateLimit: number
  createdAt: string
}

export interface McpCallLog {
  id: string
  serverId: string
  serverName?: string
  toolName: string
  projectId: string | null
  status: McpCallStatus
  latencyMs: number
  inputSummary: string
  outputSummary: string
  errorMessage: string
  createdAt: string
}

export interface McpObservabilityStats {
  totalCalls: number
  successRate: number
  avgLatencyMs: number
  callsByServer: Array<{ serverName: string; count: number }>
  callsByStatus: Array<{ status: McpCallStatus; count: number }>
  recentErrors: McpCallLog[]
}

export interface CreateMcpServerInput {
  name: string
  url?: string
  command?: string
  args?: string
  transport?: McpTransport
  authType?: McpAuthType
  env?: Record<string, string>
  authConfig?: Record<string, string>
  tags?: string[]
}

export interface UpdateMcpServerInput {
  name?: string
  url?: string
  command?: string
  args?: string
  transport?: McpTransport
  authType?: McpAuthType
  env?: Record<string, string>
  authConfig?: Record<string, string>
  enabled?: boolean
  tags?: string[]
}
