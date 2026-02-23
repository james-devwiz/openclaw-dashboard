"use client" // Interactive server list with modal state and search filtering

import { useState, useMemo } from "react"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMcpServers } from "@/hooks/useMcpServers"
import McpServerCard from "./McpServerCard"
import McpServerForm from "./McpServerForm"
import type { McpServer, CreateMcpServerInput, UpdateMcpServerInput } from "@/types/mcp.types"

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "healthy", label: "Healthy" },
  { id: "failing", label: "Failing" },
  { id: "unknown", label: "Unknown" },
  { id: "disabled", label: "Disabled" },
]

export default function McpServerList() {
  const { servers, loading, createServer, updateServer, deleteServer, testConnection, syncTools } = useMcpServers()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<McpServer | null>(null)

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === "disabled") return !s.enabled
      if (statusFilter !== "all" && s.status !== statusFilter) return false
      return true
    })
  }, [servers, search, statusFilter])

  const handleSubmit = async (data: CreateMcpServerInput | UpdateMcpServerInput) => {
    if (editingServer) {
      await updateServer(editingServer.id, data)
    } else {
      await createServer(data as CreateMcpServerInput)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this MCP server? All tools and bindings will be removed.")) return
    await deleteServer(id)
  }

  const handleEdit = (server: McpServer) => {
    setEditingServer(server)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditingServer(null)
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading servers...</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servers..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id} onClick={() => setStatusFilter(f.id)}
              className={cn("px-2.5 py-1 text-xs rounded-md transition-colors", statusFilter === f.id ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:bg-muted")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditingServer(null); setFormOpen(true) }} aria-label="Add MCP server">
          <Plus size={14} aria-hidden="true" /> Add Server
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {servers.length === 0 ? "No MCP servers configured. Click \"Add Server\" to get started." : "No servers match your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((server) => (
            <McpServerCard
              key={server.id} server={server}
              onEdit={handleEdit} onDelete={handleDelete}
              onTest={testConnection} onSync={syncTools}
            />
          ))}
        </div>
      )}

      {formOpen && <McpServerForm server={editingServer} onSubmit={handleSubmit} onClose={handleClose} />}
    </div>
  )
}
