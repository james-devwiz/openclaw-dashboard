"use client" // Requires useState for filter, busy, and detail panel state

import { useState, useMemo } from "react"

import { cn } from "@/lib/utils"
import { toggleModel, makePrimaryModel } from "@/services/architecture.service"
import ModelCard from "./ModelCard"
import ModelDetailPanel from "./ModelDetailPanel"
import type { ModelInfo } from "@/types/index"

interface ModelsPanelProps {
  models: ModelInfo[]
  onRefresh: () => void
}

export default function ModelsPanel({ models, onRefresh }: ModelsPanelProps) {
  const [filter, setFilter] = useState("all")
  const [busyModel, setBusyModel] = useState<string | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  const providers = useMemo(() => {
    const set = new Set(models.map((m) => m.provider))
    return ["all", ...Array.from(set).sort()]
  }, [models])

  const filtered = useMemo(() => {
    if (filter === "all") return models
    return models.filter((m) => m.provider === filter)
  }, [models, filter])

  const enabledCount = models.filter((m) => !m.disabled).length
  const selectedModel = models.find((m) => m.id === selectedModelId) || null

  const handleToggle = async (model: ModelInfo) => {
    setBusyModel(model.id)
    try {
      await toggleModel(model.id, model.disabled)
      onRefresh()
    } catch (err) {
      console.error("Model toggle failed:", err)
      alert(err instanceof Error ? err.message : `Failed to toggle ${model.label}.`)
    } finally {
      setBusyModel(null)
    }
  }

  const handleMakePrimary = async (model: ModelInfo) => {
    if (!confirm(`Make ${model.label} the primary model? The current primary will become a fallback.`)) return
    setBusyModel(model.id)
    try {
      await makePrimaryModel(model.id)
      onRefresh()
    } catch (err) {
      console.error("Make primary failed:", err)
      alert(err instanceof Error ? err.message : `Failed to set ${model.label} as primary.`)
    } finally {
      setBusyModel(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors capitalize",
                filter === p
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "all" ? `All (${models.length})` : p}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {enabledCount} of {models.length} enabled
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isBusy={busyModel === model.id}
            onToggle={() => handleToggle(model)}
            onMakePrimary={() => handleMakePrimary(model)}
            onClick={() => setSelectedModelId(model.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground text-sm py-8">
            No models match the selected filter
          </p>
        )}
      </div>

      <ModelDetailPanel
        model={selectedModel}
        onClose={() => setSelectedModelId(null)}
      />
    </div>
  )
}
