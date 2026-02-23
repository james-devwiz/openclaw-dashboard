import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ModelInfo } from "@/types/index"

const PROVIDER_BADGE: Record<string, string> = {
  Anthropic: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  OpenAI: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  Ollama: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
}

interface ModelCardProps {
  model: ModelInfo
  isBusy: boolean
  onToggle: () => void
  onMakePrimary: () => void
  onClick: () => void
}

export default function ModelCard({ model, isBusy, onToggle, onMakePrimary, onClick }: ModelCardProps) {
  const canToggle = !model.isPrimary
  const canMakePrimary = !model.isPrimary && !model.disabled

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick() }}
      className={cn(
        "rounded-xl border border-border bg-card p-5 space-y-3 transition-all cursor-pointer hover:border-foreground/20 hover:shadow-sm",
        model.disabled && "opacity-60"
      )}
      aria-label={`View details for ${model.label}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{model.label}</h3>
          <p className="text-xs text-muted-foreground truncate">{model.id}</p>
        </div>
        <label
          className={cn(
            "relative inline-flex cursor-pointer items-center shrink-0 mt-0.5",
            (!canToggle || isBusy) && "opacity-50 pointer-events-none"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="peer sr-only"
            checked={!model.disabled}
            onChange={onToggle}
            disabled={!canToggle || isBusy}
            aria-label={`${model.disabled ? "Enable" : "Disable"} ${model.label}`}
          />
          <div
            className="peer h-7 w-12 rounded-full bg-slate-300 dark:bg-gray-600 transition-colors duration-200 peer-checked:bg-green-500"
            title={!canToggle ? "Cannot disable the primary model" : undefined}
          />
          <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PROVIDER_BADGE[model.provider] || "bg-gray-100 text-gray-700")}>
          {model.provider}
        </span>
        {model.isPrimary && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Primary</span>
        )}
        {model.isFallback && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Fallback</span>
        )}
        {model.isHeartbeat && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">Heartbeat</span>
        )}
        {canMakePrimary && (
          <Button
            onClick={(e) => { e.stopPropagation(); onMakePrimary() }}
            disabled={isBusy}
            variant="ghost"
            size="sm"
            className="ml-auto text-blue-600 dark:text-blue-400"
            aria-label={`Make ${model.label} primary`}
          >
            <Star size={12} className="inline mr-1" />
            Make Primary
          </Button>
        )}
      </div>
    </div>
  )
}
