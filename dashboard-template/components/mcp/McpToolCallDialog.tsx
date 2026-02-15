"use client" // Modal with dynamic form inputs and async tool invocation

import { useState, useEffect, useMemo } from "react"
import { X, Play } from "lucide-react"

import type { McpTool } from "@/types/mcp.types"

interface McpToolCallDialogProps {
  tool: McpTool
  onCall: (id: string, params: Record<string, unknown>) => Promise<{ result: unknown; latencyMs: number }>
  onClose: () => void
}

interface SchemaProperty {
  type?: string
  description?: string
}

export default function McpToolCallDialog({ tool, onCall, onClose }: McpToolCallDialogProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const properties = useMemo(() => {
    try {
      const schema = JSON.parse(tool.inputSchema)
      return (schema.properties || {}) as Record<string, SchemaProperty>
    } catch { return {} }
  }, [tool.inputSchema])

  const handleCall = async () => {
    setCalling(true)
    setResult(null)
    setError(null)
    try {
      const params: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(paramValues)) {
        if (val.trim()) {
          try { params[key] = JSON.parse(val) } catch { params[key] = val }
        }
      }
      const res = await onCall(tool.id, params)
      setResult(JSON.stringify(res.result, null, 2))
      setLatency(res.latencyMs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call failed")
    } finally {
      setCalling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Call: {tool.name}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted" aria-label="Close"><X size={16} /></button>
        </div>

        {tool.description && <p className="text-xs text-muted-foreground mb-4">{tool.description}</p>}

        <div className="space-y-3 mb-4">
          {Object.entries(properties).map(([key, prop]) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1">{key} <span className="text-muted-foreground font-normal">({prop.type || "string"})</span></label>
              {prop.description && <p className="text-xs text-muted-foreground mb-1">{prop.description}</p>}
              <input
                value={paramValues[key] || ""} onChange={(e) => setParamValues((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                placeholder={prop.type === "number" ? "0" : "value"}
              />
            </div>
          ))}
          {Object.keys(properties).length === 0 && <p className="text-xs text-muted-foreground">No parameters required.</p>}
        </div>

        <button onClick={handleCall} disabled={calling} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 mb-4">
          <Play size={14} aria-hidden="true" /> {calling ? "Calling..." : "Execute"}
        </button>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-3">{error}</div>}

        {result !== null && (
          <div>
            {latency !== null && <p className="text-xs text-muted-foreground mb-2">Completed in {latency}ms</p>}
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-60 text-foreground">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
