"use client" // Requires useEffect for fetching actions on mount

import { useEffect } from "react"
import { Play, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ACTION_STATUS_COLORS, ACTION_TYPE_LABELS } from "@/lib/linkedin-constants"

import type { LinkedInAction, LinkedInActionStatus, LinkedInActionType } from "@/types"

interface ActionQueueTabProps {
  actions: LinkedInAction[]
  loading: boolean
  onFetch: () => void
  onExecute: (actionId: string) => void
}

const STATUS_ICONS: Record<LinkedInActionStatus, typeof Clock> = {
  pending: Clock, approved: Play, executed: CheckCircle, rejected: XCircle, failed: AlertTriangle,
}

export default function ActionQueueTab({ actions, loading, onFetch, onExecute }: ActionQueueTabProps) {
  useEffect(() => { onFetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  if (actions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">No LinkedIn actions in queue</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => {
        const Icon = STATUS_ICONS[action.status]
        const payload = parsePayload(action.payload)

        return (
          <div key={action.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Icon size={16} className="shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {ACTION_TYPE_LABELS[action.actionType as LinkedInActionType] || action.actionType}
                    </span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", ACTION_STATUS_COLORS[action.status])}>
                      {action.status}
                    </span>
                  </div>
                  {action.targetName && (
                    <p className="text-xs text-muted-foreground">To: {action.targetName}</p>
                  )}
                  {typeof payload.content === "string" && payload.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {payload.content.slice(0, 120)}
                    </p>
                  )}
                  {action.error && (
                    <p className="text-xs text-red-500 mt-1">{action.error}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(action.createdAt).toLocaleString("en-AU")}
                  </p>
                </div>
              </div>

              {action.status === "approved" && (
                <Button onClick={() => onExecute(action.id)} size="sm"
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                  aria-label={`Execute action for ${action.targetName}`}>
                  <Play size={12} aria-hidden="true" /> Execute
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function parsePayload(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw) } catch { return {} }
}
