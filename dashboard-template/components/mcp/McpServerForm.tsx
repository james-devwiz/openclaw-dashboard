"use client" // Modal form with controlled inputs requires client-side state

import { useState, useEffect } from "react"
import { X } from "lucide-react"

import type { McpServer, McpTransport, McpAuthType, CreateMcpServerInput, UpdateMcpServerInput } from "@/types/mcp.types"

interface McpServerFormProps {
  server?: McpServer | null
  onSubmit: (data: CreateMcpServerInput | UpdateMcpServerInput) => Promise<void>
  onClose: () => void
}

const TRANSPORTS: McpTransport[] = ["stdio", "http", "sse"]
const AUTH_TYPES: McpAuthType[] = ["none", "api_key", "bearer", "oauth2"]

export default function McpServerForm({ server, onSubmit, onClose }: McpServerFormProps) {
  const [name, setName] = useState(server?.name || "")
  const [transport, setTransport] = useState<McpTransport>(server?.transport || "stdio")
  const [url, setUrl] = useState(server?.url || "")
  const [command, setCommand] = useState(server?.command || "")
  const [args, setArgs] = useState(server?.args || "")
  const [authType, setAuthType] = useState<McpAuthType>(server?.authType || "none")
  const [envText, setEnvText] = useState(server ? JSON.stringify(server.env, null, 2) : "{}")
  const [tags, setTags] = useState(server?.tags?.join(", ") || "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let env: Record<string, string> = {}
      try { env = JSON.parse(envText) } catch { /* invalid JSON — skip */ }
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean)
      await onSubmit({ name, transport, url, command, args, authType, env, tags: tagList })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{server ? "Edit Server" : "Add Server"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="my-server" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Transport</label>
            <select value={transport} onChange={(e) => setTransport(e.target.value as McpTransport)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
              {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {transport === "stdio" ? (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">Command</label>
                <input value={command} onChange={(e) => setCommand(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="npx" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Args</label>
                <input value={args} onChange={(e) => setArgs(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="-y @notionhq/mcp" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium mb-1">URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="http://localhost:3001/sse" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">Auth Type</label>
            <select value={authType} onChange={(e) => setAuthType(e.target.value as McpAuthType)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
              {AUTH_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Environment Variables (JSON)</label>
            <textarea value={envText} onChange={(e) => setEnvText(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" placeholder='{"API_KEY": "..."}' />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="productivity, search" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !name} className="px-4 py-2 text-sm rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Saving..." : server ? "Update" : "Add Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
