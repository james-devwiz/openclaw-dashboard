"use client" // Requires useState for confirm delete state and loading indicators

import { useState } from "react"

import { Play, Trash2, ToggleLeft, ToggleRight, ExternalLink, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Tooltip from "@/components/ui/Tooltip"
import { cn } from "@/lib/utils"
import { PLATFORM_COLORS } from "@/lib/content-constants"
import type { IdeaSource } from "@/types"

interface IdeaSourceRowProps {
  source: IdeaSource
  onToggle: (id: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onTrigger: (name: string) => Promise<boolean>
}

function scoreColor(score: number): string {
  if (score >= 7) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  if (score >= 4) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
}

function statusBadge(status?: string): React.ReactNode {
  if (!status) return <span className="text-[10px] text-muted-foreground">—</span>
  const color = status === "ok" ? "text-emerald-600" : status === "error" ? "text-red-600" : "text-amber-600"
  return <span className={cn("text-[10px] font-medium", color)}>{status}</span>
}

function formatLastRun(iso?: string): string {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function IdeaSourceRow({ source, onToggle, onDelete, onTrigger }: IdeaSourceRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [toggling, setToggling] = useState(false)
  const colors = PLATFORM_COLORS[source.platform]
  const truncUrl = source.url.length > 40 ? source.url.slice(0, 40) + "..." : source.url

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
    <tr className={cn("border-b border-border last:border-b-0", !source.enabled && "opacity-50")}>
      <td className="py-2.5 px-3">
        <Badge className={cn(colors.bg, colors.text, "text-[10px] font-medium")}>
          {source.platform}
        </Badge>
      </td>
      <td className="py-2.5 px-3 text-sm">
        <a
          href={source.url} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          aria-label={`Open ${source.url}`}
        >
          {truncUrl}
          <ExternalLink size={10} aria-hidden="true" className="shrink-0" />
        </a>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs text-muted-foreground capitalize">{source.frequency.replace("-", " ")}</span>
      </td>
      <td className="py-2.5 px-3">
        {source.validationScore != null && (
          <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold", scoreColor(source.validationScore))}>
            {source.validationScore}
          </span>
        )}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex flex-col">
          <span className="text-xs text-foreground">{formatLastRun(source.lastRun)}</span>
          {statusBadge(source.lastStatus)}
        </div>
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-xs font-medium text-foreground">{source.ideaCount ?? 0}</span>
      </td>
      <td className="py-2.5 px-3">
        <span className={cn("text-xs", source.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
          {source.enabled ? "Active" : "Paused"}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          {source.cronJobName && (
            <Tooltip label="Run scan now">
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                aria-label="Trigger scan now"
              >
                {triggering
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Play size={12} />}
              </button>
            </Tooltip>
          )}
          <Tooltip label={source.enabled ? "Pause source" : "Enable source"}>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              aria-label={source.enabled ? "Pause source" : "Enable source"}
            >
              {toggling
                ? <Loader2 size={14} className="animate-spin" />
                : source.enabled
                  ? <ToggleRight size={14} className="text-emerald-600" />
                  : <ToggleLeft size={14} />}
            </button>
          </Tooltip>
          {confirmDelete ? (
            <button
              onClick={() => { onDelete(source.id); setConfirmDelete(false) }}
              className="p-1.5 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-[10px] font-medium"
              aria-label="Confirm delete"
            >
              Confirm
            </button>
          ) : (
            <Tooltip label="Delete source">
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-red-600"
                aria-label="Delete source"
              >
                <Trash2 size={12} />
              </button>
            </Tooltip>
          )}
        </div>
      </td>
    </tr>
  )
}
