"use client" // Interactive catalogue with search, server filter, and tool call dialog

import { useState, useMemo } from "react"
import { Search } from "lucide-react"

import { useMcpTools } from "@/hooks/useMcpTools"
import { useMcpServers } from "@/hooks/useMcpServers"
import McpToolRow from "./McpToolRow"
import McpToolCallDialog from "./McpToolCallDialog"
import type { McpTool } from "@/types/mcp.types"

export default function McpToolsCatalogue() {
  const { servers } = useMcpServers()
  const { tools, loading, callTool } = useMcpTools()
  const [search, setSearch] = useState("")
  const [serverFilter, setServerFilter] = useState("all")
  const [callTarget, setCallTarget] = useState<McpTool | null>(null)

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (serverFilter !== "all" && t.serverId !== serverFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [tools, search, serverFilter])

  if (loading) return <p className="text-muted-foreground text-sm">Loading tools...</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <select
          value={serverFilter} onChange={(e) => setServerFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          aria-label="Filter by server"
        >
          <option value="all">All servers</option>
          {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} tool{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {tools.length === 0 ? "No tools found. Sync tools from a server first." : "No tools match your search."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((tool) => (
            <McpToolRow key={tool.id} tool={tool} onTryIt={setCallTarget} />
          ))}
        </div>
      )}

      {callTarget && (
        <McpToolCallDialog tool={callTarget} onCall={callTool} onClose={() => setCallTarget(null)} />
      )}
    </div>
  )
}
