"use client" // Project selector and binding management require client-side state

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"

import { useMcpBindings } from "@/hooks/useMcpBindings"
import { useMcpServers } from "@/hooks/useMcpServers"
import { getProjectsApi } from "@/services/project.service"
import McpBindingRow from "./McpBindingRow"
import type { Project } from "@/types/index"

export default function McpBindingsPanel() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { servers } = useMcpServers()
  const { bindings, loading, createBinding, updateBinding, deleteBinding } = useMcpBindings(selectedProject)
  const [addServer, setAddServer] = useState("")

  useEffect(() => {
    getProjectsApi().then(setProjects).catch(console.error)
  }, [])

  const handleAdd = async () => {
    if (!addServer || !selectedProject) return
    await createBinding(addServer)
    setAddServer("")
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    await updateBinding(id, { enabled })
  }

  const handleRateLimit = async (id: string, rateLimit: number) => {
    await updateBinding(id, { rateLimit })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this binding?")) return
    await deleteBinding(id)
  }

  const boundServerIds = new Set(bindings.filter((b) => !b.toolId).map((b) => b.serverId))
  const unboundServers = servers.filter((s) => s.enabled && !boundServerIds.has(s.id))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedProject || ""} onChange={(e) => setSelectedProject(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          aria-label="Select project"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selectedProject ? (
        <p className="text-muted-foreground text-sm">Select a project to manage MCP bindings.</p>
      ) : loading ? (
        <p className="text-muted-foreground text-sm">Loading bindings...</p>
      ) : (
        <div>
          {bindings.length > 0 && (
            <div className="space-y-2 mb-6">
              {bindings.map((b) => (
                <McpBindingRow key={b.id} binding={b} onToggle={handleToggle} onRateLimit={handleRateLimit} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {bindings.length === 0 && <p className="text-muted-foreground text-sm mb-4">No MCP servers bound to this project.</p>}

          {unboundServers.length > 0 && (
            <div className="flex items-center gap-2">
              <select value={addServer} onChange={(e) => setAddServer(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" aria-label="Server to add">
                <option value="">Add server...</option>
                {unboundServers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleAdd} disabled={!addServer} className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50" aria-label="Add binding">
                <Plus size={14} aria-hidden="true" /> Bind
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
