"use client" // Interactive card with action buttons requires client-side handlers

import { useState } from "react"
import { Server, Wifi, WifiOff, RefreshCw, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { McpServer } from "@/types/mcp.types"

const STATUS_STYLES: Record<string, string> = {
  healthy: "bg-emerald-100 text-emerald-700",
  failing: "bg-red-100 text-red-700",
  disabled: "bg-gray-100 text-gray-500",
  unknown: "bg-amber-100 text-amber-700",
}

interface McpServerCardProps {
  server: McpServer
  onEdit: (server: McpServer) => void
  onDelete: (id: string) => void
  onTest: (id: string) => Promise<unknown>
  onSync: (id: string) => Promise<unknown>
}

export default function McpServerCard({ server, onEdit, onDelete, onTest, onSync }: McpServerCardProps) {
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    try { await onTest(server.id) } finally { setTesting(false) }
  }

  const handleSync = async () => {
    setSyncing(true)
    try { await onSync(server.id) } finally { setSyncing(false) }
  }

  return (
    <div className={cn("rounded-xl p-5 bg-card border border-border", !server.enabled && "opacity-60")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="font-medium text-sm">{server.name}</h3>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[server.status] || STATUS_STYLES.unknown)}>
          {server.status}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground mb-4">
        <p>Transport: <span className="text-foreground">{server.transport}</span></p>
        {server.transport === "stdio" && server.command && (
          <p className="truncate">Command: <span className="text-foreground">{server.command} {server.args}</span></p>
        )}
        {server.transport !== "stdio" && server.url && (
          <p className="truncate">URL: <span className="text-foreground">{server.url}</span></p>
        )}
        <p>Tools: <span className="text-foreground">{server.toolCount}</span></p>
        {server.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {server.tags.map((tag) => (
              <span key={tag} className="bg-muted px-1.5 py-0.5 rounded text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={handleTest} disabled={testing} className="p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Test connection">
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
        </button>
        <button onClick={handleSync} disabled={syncing} className="p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Sync tools">
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        </button>
        <button onClick={() => onEdit(server)} className="p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Edit server">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(server.id)} className="p-1.5 rounded-md hover:bg-muted text-red-500 transition-colors" aria-label="Delete server">
          <Trash2 size={14} />
        </button>
        {!server.enabled && <WifiOff size={14} className="ml-auto text-muted-foreground" aria-hidden="true" />}
      </div>
    </div>
  )
}
