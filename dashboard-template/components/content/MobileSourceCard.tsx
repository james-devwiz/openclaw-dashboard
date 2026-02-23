"use client" // Requires useState for loading states on mobile action buttons

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IdeaSource } from "@/types"

interface MobileSourceCardProps {
  source: IdeaSource
  onToggle: (id: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onTrigger: (name: string) => Promise<boolean>
}

export default function MobileSourceCard({ source, onToggle, onDelete, onTrigger }: MobileSourceCardProps) {
  const [triggering, setTriggering] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleTrigger = async () => {
    if (!source.cronJobName || triggering) return
    setTriggering(true)
    await onTrigger(source.cronJobName)
    setTriggering(false)
  }

  const handleToggle = async () => {
    if (toggling) return
    setToggling(true)
    await onToggle(source.id)
    setToggling(false)
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", !source.enabled && "opacity-50")}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium capitalize">{source.platform}</span>
        <span className={cn("text-[10px]", source.enabled ? "text-emerald-600" : "text-muted-foreground")}>
          {source.enabled ? "Active" : "Paused"}
        </span>
      </div>
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate mb-2">
        {source.url}
      </a>
      <div className="flex items-center gap-3 mb-2 text-[10px] text-muted-foreground">
        <span className="capitalize">{source.frequency.replace("-", " ")}</span>
        <span>{source.lastRun ? `Last: ${new Date(source.lastRun).toLocaleDateString()}` : "Never run"}</span>
        <span>{source.ideaCount ?? 0} ideas</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">&nbsp;</span>
        <div className="flex items-center gap-2">
          {source.cronJobName && (
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="text-[10px] text-blue-600 disabled:opacity-50 inline-flex items-center gap-1"
              aria-label="Run scan now"
            >
              {triggering && <Loader2 size={10} className="animate-spin" />}
              {triggering ? "Running..." : "Run"}
            </button>
          )}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="text-[10px] text-muted-foreground disabled:opacity-50 inline-flex items-center gap-1"
            aria-label={source.enabled ? "Pause source" : "Enable source"}
          >
            {toggling && <Loader2 size={10} className="animate-spin" />}
            {source.enabled ? "Pause" : "Enable"}
          </button>
          {confirmDelete ? (
            <button
              onClick={() => { onDelete(source.id); setConfirmDelete(false) }}
              className="text-[10px] text-red-600 font-medium"
              aria-label="Confirm delete"
            >
              Confirm?
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[10px] text-red-600"
              aria-label="Delete source"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
