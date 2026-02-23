"use client" // Requires useState/useEffect for async detail loading + keyboard listener

import { useState, useEffect, useCallback } from "react"
import { X, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { labelFromId } from "@/lib/model-utils"
import { getModelDetail } from "@/services/architecture.service"
import {
  ModelInfoSection,
  AgentsSection,
  CronJobsSection,
  TopicsSection,
  HeartbeatSection,
} from "./ModelDetailSections"
import type { ModelInfo, ModelDetail } from "@/types/index"

interface ModelDetailPanelProps {
  model: ModelInfo | null
  onClose: () => void
}

export default function ModelDetailPanel({ model, onClose }: ModelDetailPanelProps) {
  const [detail, setDetail] = useState<ModelDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!model) return
    setLoading(true)
    setError(null)
    setDetail(null)
    getModelDetail(model.id)
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [model])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    if (!model) return
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [model, handleKeyDown])

  if (!model) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Model detail viewer">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <DetailHeader model={model} onClose={onClose} />
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading model detail...</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-muted-foreground italic py-4">Failed to load model detail.</p>
          )}
          {detail && (
            <>
              <ModelInfoSection detail={detail} />
              <AgentsSection agents={detail.agents} />
              <CronJobsSection cronJobs={detail.cronJobs} />
              <TopicsSection topics={detail.topics} />
              {detail.isHeartbeat && <HeartbeatSection />}
              {!detail.agents.length && !detail.cronJobs.length && !detail.topics.length && !detail.isHeartbeat && (
                <p className="text-sm text-muted-foreground italic">
                  No agents, cron jobs, or topics are configured to use this model.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailHeader({ model, onClose }: { model: ModelInfo; onClose: () => void }) {
  return (
    <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-foreground truncate">{labelFromId(model.id)}</h2>
        <div className="flex items-center gap-2 mt-0.5">
          {model.isPrimary && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Primary
            </span>
          )}
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            model.disabled
              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
          )}>
            {model.disabled ? "disabled" : "enabled"}
          </span>
        </div>
      </div>
      <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0" aria-label="Close panel">
        <X size={16} />
      </button>
    </div>
  )
}
