# Phase 15: MCP Management Centre — Server Management, Tools Catalogue & Observability

## Goal

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

Add MCP (Model Context Protocol) server management to the Command Centre dashboard. MCP servers extend your AI's capabilities by connecting it to external tools — web scraping, database access, file systems, SaaS APIs, and more. This phase adds a full management UI as a tab within the Architecture page, using **mcporter** (a bundled CLI tool) as the bridge to MCP servers.

**What you get:**
- Visual management of MCP servers (add, test, sync, enable/disable)
- Browsable tools catalogue with schema viewer and "Try it" invocation
- Per-project tool bindings with rate limiting
- Call log observability with success rates and latency stats

---

### 15.1 Database Schema — 4 New Tables

Add these tables to `initSchema()` in `lib/db.ts`:

```sql
-- MCP Servers
CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  transport TEXT NOT NULL DEFAULT 'stdio',
  url TEXT NOT NULL DEFAULT '',
  command TEXT DEFAULT '',
  args TEXT DEFAULT '',
  env TEXT DEFAULT '',
  authType TEXT NOT NULL DEFAULT 'none',
  authConfig TEXT DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'unknown',
  statusMessage TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  lastHealthCheck TEXT,
  toolCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_updated ON mcp_servers(updatedAt);

-- MCP Tools (discovered from servers)
CREATE TABLE IF NOT EXISTS mcp_tools (
  id TEXT PRIMARY KEY,
  serverId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  inputSchema TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  lastSynced TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (serverId) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  UNIQUE(serverId, name)
);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_server ON mcp_tools(serverId);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(name);

-- MCP Bindings (per-project access control)
CREATE TABLE IF NOT EXISTS mcp_bindings (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  serverId TEXT NOT NULL,
  toolId TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  rateLimit INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (serverId) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  FOREIGN KEY (toolId) REFERENCES mcp_tools(id) ON DELETE SET NULL,
  UNIQUE(projectId, serverId, toolId)
);
CREATE INDEX IF NOT EXISTS idx_mcp_bindings_project ON mcp_bindings(projectId);

-- MCP Call Logs (observability)
CREATE TABLE IF NOT EXISTS mcp_call_logs (
  id TEXT PRIMARY KEY,
  serverId TEXT NOT NULL,
  toolName TEXT NOT NULL,
  projectId TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  latencyMs INTEGER NOT NULL DEFAULT 0,
  inputSummary TEXT DEFAULT '',
  outputSummary TEXT DEFAULT '',
  errorMessage TEXT DEFAULT '',
  createdAt TEXT NOT NULL,
  FOREIGN KEY (serverId) REFERENCES mcp_servers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_created ON mcp_call_logs(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_server ON mcp_call_logs(serverId);
```

Auto-cleanup: `DELETE FROM mcp_call_logs WHERE createdAt < datetime('now', '-30 days')` on init.

**Key fields:**
- `transport`: `"stdio"` | `"http"` | `"sse"` — how to connect to the server
- `env`: JSON string of environment variables (e.g. `{"NOTION_API_KEY":"..."}`)
- `authType`: `"none"` | `"api_key"` | `"bearer"` | `"oauth2"`
- `status`: `"healthy"` | `"failing"` | `"disabled"` | `"unknown"`
- `tags`: comma-separated for filtering
- Bindings: `toolId` NULL = server-level binding (all tools), non-NULL = specific tool
- `rateLimit`: calls per minute, 0 = unlimited

### 15.2 Type Definitions — `types/mcp.types.ts`

```typescript
export type McpTransport = "stdio" | "http" | "sse"
export type McpAuthType = "none" | "api_key" | "bearer" | "oauth2"
export type McpServerStatus = "healthy" | "failing" | "disabled" | "unknown"
export type McpCallStatus = "success" | "error" | "timeout"

export interface McpServer {
  id: string; name: string; transport: McpTransport; url: string
  command: string; args: string; env: Record<string, string>
  authType: McpAuthType; authConfig: Record<string, string>
  enabled: boolean; status: McpServerStatus; statusMessage: string
  tags: string[]; lastHealthCheck: string | null; toolCount: number
  createdAt: string; updatedAt: string
}

export interface McpTool {
  id: string; serverId: string; serverName?: string; name: string
  description: string; inputSchema: Record<string, unknown>
  tags: string[]; enabled: boolean; lastSynced: string | null
  createdAt: string; updatedAt: string
}

export interface McpBinding {
  id: string; projectId: string; serverId: string; toolId: string | null
  serverName?: string; toolName?: string; enabled: boolean
  rateLimit: number; createdAt: string
}

export interface McpCallLog {
  id: string; serverId: string; serverName?: string; toolName: string
  projectId: string | null; status: McpCallStatus; latencyMs: number
  inputSummary: string; outputSummary: string; errorMessage: string
  createdAt: string
}

export interface McpObservabilityStats {
  totalCalls: number; successRate: number; avgLatencyMs: number
  callsByServer: { name: string; count: number }[]
  callsByStatus: { status: string; count: number }[]
  recentErrors: McpCallLog[]
}

export interface CreateMcpServerInput {
  name: string; url?: string; command?: string; args?: string
  transport?: McpTransport; authType?: McpAuthType
  env?: Record<string, string>; authConfig?: Record<string, string>
  tags?: string[]
}

export interface UpdateMcpServerInput extends Partial<CreateMcpServerInput> {
  enabled?: boolean
}
```

Add `"mcp"` to `ActivityEntityType` in `types/activity.types.ts`.
Re-export from `types/index.ts`.

### 15.3 mcporter Bridge — `lib/mcporter.ts`

Uses `execFile` (same pattern as `workspace-git.ts`) — no shell injection risk.

```typescript
import { execFile } from "child_process"
import { promisify } from "util"
import { writeFile, mkdir } from "fs/promises"

const exec = promisify(execFile)
const BIN = "/usr/bin/mcporter"
const CONFIG = "/root/.mcporter/mcporter.json"
```

Functions:
- `mcporterListTools(server)` — `mcporter list <server> --schema --json`. Parses `{ tools: [...] }` nested format (mcporter wraps tools in a server object).
- `mcporterCall(server, tool, params)` — measures latency, calls `mcporter call <server.tool> --args '<json>'`
- `mcporterTestConnection(server)` — parses `{ status: "ok" }` response
- `mcporterDaemonStatus()` / `mcporterDaemonRestart()`
- `generateMcporterConfig(servers)` — builds config from DB, writes to CONFIG, restarts daemon
- `syncConfigFromDb()` — reads all enabled servers, calls generateMcporterConfig

**Config format (mcporter v0.7.3):**

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@notionhq/mcp"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

> **Important:** The top-level key must be `mcpServers` (not `servers`). mcporter uses Zod validation and will reject configs with the wrong key.

**stdio vs HTTP/SSE:**
- stdio servers: use `command` + `args` keys
- HTTP/SSE servers: use `url` key (mcporter handles the transport)

Called automatically after any server CREATE/UPDATE/DELETE via the API routes — the dashboard auto-generates the config file on every change, eliminating manual config editing.

### 15.4 Database Layer — 4 New Files

Follow the `db-projects.ts` pattern: Row interface, rowToEntity converter, logActivity on all mutations.

| File | Functions |
|---|---|
| `lib/db-mcp-servers.ts` | `getMcpServers`, `getMcpServer`, `createMcpServer`, `updateMcpServer`, `deleteMcpServer`, `updateMcpServerStatus` |
| `lib/db-mcp-tools.ts` | `getMcpTools` (joins serverName, search filter), `getMcpTool`, `syncMcpTools` (upsert + stale removal in transaction), `updateMcpTool` |
| `lib/db-mcp-bindings.ts` | `getMcpBindings` (joins server/tool names), `createMcpBinding`, `updateMcpBinding`, `deleteMcpBinding` |
| `lib/db-mcp-logs.ts` | `logMcpCall`, `getMcpCallLogs` (paginated), `getMcpObservabilityStats` (aggregates), `cleanupOldMcpLogs` |

### 15.5 API Routes — 8 New Files

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/mcp/servers` | GET, POST, PATCH, DELETE | Server CRUD + auto config sync |
| `/api/mcp/servers/[id]/health` | POST | Health check via mcporter |
| `/api/mcp/servers/[id]/sync` | POST | Discover tools from server |
| `/api/mcp/tools` | GET, PATCH | Tool catalogue + enable/disable |
| `/api/mcp/tools/[id]/call` | POST | Invoke tool + log call |
| `/api/mcp/bindings` | GET, POST, PATCH, DELETE | Project binding management |
| `/api/mcp/logs` | GET | Paginated call logs |
| `/api/mcp/stats` | GET | Observability stats |

POST/PATCH/DELETE on `/api/mcp/servers` also call `syncConfigFromDb()` after mutation.
Tool invocation (`/api/mcp/tools/[id]/call`) logs via `logMcpCall()` (success or error).

### 15.6 Service Layer & Hooks

**`services/mcp.service.ts`** — wraps all fetch calls:
```
getMcpServersApi, createMcpServerApi, updateMcpServerApi, deleteMcpServerApi
testMcpServerApi(id), syncMcpToolsApi(id)
getMcpToolsApi(serverId?, search?), updateMcpToolApi, callMcpToolApi
getMcpBindingsApi(projectId), createMcpBindingApi, updateMcpBindingApi, deleteMcpBindingApi
getMcpCallLogsApi(filter), getMcpStatsApi(hours?)
```

| Hook | Returns |
|---|---|
| `hooks/useMcpServers.ts` | `servers, loading, createServer, updateServer, deleteServer, testConnection, syncTools, refresh` (60s polling) |
| `hooks/useMcpTools.ts` | `tools, loading, updateTool, callTool, refresh` (optional serverId filter) |
| `hooks/useMcpBindings.ts` | `bindings, loading, createBinding, updateBinding, deleteBinding, refresh` (takes projectId) |
| `hooks/useMcpObservability.ts` | `stats, logs, logsTotal, loading, loadMoreLogs, refresh` (separate stats polling + paginated logs) |

### 15.7 UI Components — Architecture Page MCP Tab

Add `{ id: "mcp", label: "MCP" }` to the `TABS` array in `app/architecture/page.tsx` (between Skills and Architecture). Import and render `McpManagementPanel` when `activeTab === "mcp"`.

> **Important:** The MCP tab must render independently of the architecture data loading state — place the `activeTab === "mcp"` check before the loading/data checks for agents/skills/architecture.

**14 components in `components/mcp/`:**

| Component | Lines | Purpose |
|---|---|---|
| `McpManagementPanel` | ~50 | Sub-tab container with 4 sections |
| `McpSubTabs` | ~40 | Servers / Tools / Bindings / Observability navigation |
| `McpServerList` | ~90 | Server grid + search + status filter + "Add Server" |
| `McpServerCard` | ~80 | Status badge, transport, tool count, test/sync/edit/delete |
| `McpServerForm` | ~120 | Create/edit modal (transport-aware: stdio = command/args, HTTP/SSE = URL) |
| `McpToolsCatalogue` | ~100 | Searchable table with server filter dropdown |
| `McpToolRow` | ~90 | Expandable row: name, server badge, description, schema, "Try it" |
| `McpToolSchemaView` | ~40 | JSON schema in `<pre>` with `bg-muted` |
| `McpToolCallDialog` | ~120 | Dynamic param form from schema, execute, show result with latency |
| `McpBindingsPanel` | ~100 | Project selector + server binding list + add new |
| `McpBindingRow` | ~60 | Toggle + rate limit input per binding |
| `McpObservabilityPanel` | ~80 | Time range (1h/6h/24h/7d) + stats cards + log table |
| `McpStatsCards` | ~60 | 4-card grid: Total Calls, Success %, Avg Latency, Active Servers |
| `McpCallLogTable` | ~100 | Paginated table with status badges + load more |

All components under 200 lines, CSS custom properties for colors, `"use client"` with justification.

### 15.8 Adding Your First MCP Server

Once deployed, add a server from the Architecture > MCP tab:

**Example — stdio server (filesystem):**
- Name: `filesystem`
- Transport: stdio
- Command: `npx`
- Args: `-y @modelcontextprotocol/server-filesystem /tmp`

**Example — SSE server (Bright Data web scraping):**
- Name: `bright-data`
- Transport: SSE
- URL: `https://mcp.brightdata.com/mcp?token=YOUR_TOKEN&groups=advanced_scraping,social,browser,research`

After adding: click "Test Connection" (status turns green), then "Sync Tools" (discovers available tools). Browse the Tools sub-tab to see what's available.

---

## Files Created

| Category | Files |
|---|---|
| Types | `types/mcp.types.ts` (new), `types/activity.types.ts` (modified), `types/index.ts` (modified) |
| Database | `lib/db-mcp-servers.ts`, `lib/db-mcp-tools.ts`, `lib/db-mcp-bindings.ts`, `lib/db-mcp-logs.ts`, `lib/db.ts` (modified) |
| Bridge | `lib/mcporter.ts` |
| API | `app/api/mcp/servers/route.ts`, `app/api/mcp/servers/[id]/health/route.ts`, `app/api/mcp/servers/[id]/sync/route.ts`, `app/api/mcp/tools/route.ts`, `app/api/mcp/tools/[id]/call/route.ts`, `app/api/mcp/bindings/route.ts`, `app/api/mcp/logs/route.ts`, `app/api/mcp/stats/route.ts` |
| Service | `services/mcp.service.ts` |
| Hooks | `hooks/useMcpServers.ts`, `hooks/useMcpTools.ts`, `hooks/useMcpBindings.ts`, `hooks/useMcpObservability.ts` |
| Components | 14 files in `components/mcp/` |
| Page | `app/architecture/page.tsx` (modified) |
| **Total** | **33 new, 4 modified** |

## Verification

- [ ] SQLite has 4 new tables: `mcp_servers`, `mcp_tools`, `mcp_bindings`, `mcp_call_logs`
- [ ] Architecture page shows MCP tab (between Skills and Architecture)
- [ ] MCP tab loads independently of architecture data
- [ ] Add a test server (stdio or SSE) via the Servers sub-tab
- [ ] "Test Connection" returns healthy status (green badge)
- [ ] "Sync Tools" discovers and lists tools
- [ ] Tools sub-tab shows all synced tools with schemas
- [ ] "Try it" on a tool opens the call dialog and returns results
- [ ] Bindings sub-tab shows project selector and toggle matrix
- [ ] Observability sub-tab shows stats cards and call log table
- [ ] `~/.mcporter/mcporter.json` auto-generated after adding a server
- [ ] Activity log shows MCP mutations (entity type "mcp")
- [ ] Auto-cleanup removes call logs older than 30 days
