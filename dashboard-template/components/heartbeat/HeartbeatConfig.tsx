"use client" // Requires useGateway hook for gateway config data + trigger state

import { useState } from "react"
import { Settings, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
import { useGateway } from "@/hooks/useGateway"

export function HeartbeatConfig({ onTriggered }: { onTriggered?: () => void }) {
  const { config, loading } = useGateway()
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<string | null>(null)

  if (loading || !config) {
    return <div className="p-4 rounded-xl border border-border bg-card shadow-sm animate-pulse h-24 mb-6" />
  }

  const enabled = config.heartbeat?.enabled ?? false
  const interval = config.heartbeat?.interval
  const intervalStr = interval ? `Every ${interval}m` : "—"

  async function handleTrigger() {
    setTriggering(true)
    setTriggerResult(null)
    try {
      const res = await apiFetch("/api/heartbeats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" }),
      })
      if (res.ok) {
        setTriggerResult("Heartbeat triggered")
        onTriggered?.()
      } else {
        const data = await res.json()
        setTriggerResult(data.error || "Trigger failed")
      }
    } catch {
      setTriggerResult("Trigger failed")
    } finally {
      setTriggering(false)
      setTimeout(() => setTriggerResult(null), 5000)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
        </div>
        <div className="flex items-center gap-2">
          {triggerResult && (
            <span className="text-xs text-muted-foreground">{triggerResult}</span>
          )}
          <Button
            size="sm"
            onClick={handleTrigger}
            disabled={triggering}
            className="bg-emerald-600 hover:bg-emerald-700"
            aria-label="Trigger heartbeat manually"
          >
            {triggering ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : (
              <Play size={12} aria-hidden="true" />
            )}
            {triggering ? "Running..." : "Run Now"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            enabled ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          )}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Interval</span>
          <span className="text-sm font-medium text-foreground">{intervalStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Model</span>
          <span className="text-sm font-medium text-foreground">{config.model || "—"}</span>
        </div>
      </div>
    </div>
  )
}
