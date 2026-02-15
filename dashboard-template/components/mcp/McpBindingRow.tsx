"use client" // Interactive toggle and rate limit input per binding

import { useState } from "react"
import { Trash2 } from "lucide-react"

import type { McpBinding } from "@/types/mcp.types"

interface McpBindingRowProps {
  binding: McpBinding
  onToggle: (id: string, enabled: boolean) => Promise<void>
  onRateLimit: (id: string, rateLimit: number) => Promise<void>
  onDelete: (id: string) => void
}

export default function McpBindingRow({ binding, onToggle, onRateLimit, onDelete }: McpBindingRowProps) {
  const [rateLimit, setRateLimit] = useState(String(binding.rateLimit || ""))

  const handleRateLimitBlur = () => {
    const num = parseInt(rateLimit, 10) || 0
    if (num !== binding.rateLimit) {
      onRateLimit(binding.id, num)
    }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 border border-border rounded-lg">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox" checked={binding.enabled}
          onChange={(e) => onToggle(binding.id, e.target.checked)}
          className="rounded border-border"
          aria-label={`Toggle ${binding.serverName} binding`}
        />
      </label>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{binding.serverName}</span>
        {binding.toolName && (
          <span className="text-xs text-muted-foreground ml-2">/ {binding.toolName}</span>
        )}
        {!binding.toolName && (
          <span className="text-xs text-muted-foreground ml-2">(all tools)</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Rate limit:</label>
        <input
          value={rateLimit} onChange={(e) => setRateLimit(e.target.value)}
          onBlur={handleRateLimitBlur}
          className="w-16 px-2 py-1 rounded border border-border bg-background text-xs text-center"
          placeholder="0"
          aria-label="Rate limit (calls/min)"
        />
        <span className="text-xs text-muted-foreground">/min</span>
      </div>

      <button onClick={() => onDelete(binding.id)} className="p-1.5 rounded hover:bg-muted text-red-500 transition-colors" aria-label="Remove binding">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
