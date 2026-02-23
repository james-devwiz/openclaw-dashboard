"use client" // Requires useState/useEffect for fetching install specs and managing install state

import { useState, useEffect } from "react"
import { X, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSkillInstallSpecs, installSkill } from "@/services/architecture.service"
import type { SkillInstallSpec } from "@/types/index"

interface SkillInstallModalProps {
  skillName: string | null
  onClose: () => void
  onInstalled: () => void
}

export default function SkillInstallModal({ skillName, onClose, onInstalled }: SkillInstallModalProps) {
  const [specs, setSpecs] = useState<SkillInstallSpec[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (!skillName) return
    setLoading(true)
    setResult(null)
    getSkillInstallSpecs(skillName)
      .then(setSpecs)
      .catch(() => setSpecs([]))
      .finally(() => setLoading(false))
  }, [skillName])

  if (!skillName) return null

  const handleInstall = async (specId: string) => {
    setInstalling(specId)
    setResult(null)
    try {
      const res = await installSkill(skillName, specId)
      setResult({ type: "success", message: res.message })
      onInstalled()
    } catch (err) {
      setResult({ type: "error", message: err instanceof Error ? err.message : "Install failed" })
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Install {skillName}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading install options...
          </div>
        ) : specs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No automatic installer available for this platform.
          </p>
        ) : (
          <div className="space-y-3">
            {specs.map((spec) => (
              <div key={spec.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{spec.label}</p>
                  <p className="text-xs text-muted-foreground">Kind: {spec.kind}</p>
                </div>
                <Button
                  onClick={() => handleInstall(spec.id)}
                  disabled={!spec.available || installing !== null}
                  size="sm"
                  aria-label={`Install ${spec.label}`}
                >
                  {installing === spec.id ? (
                    <><Loader2 size={12} className="animate-spin" /> Installing...</>
                  ) : !spec.available ? (
                    "Unavailable"
                  ) : (
                    <><Download size={12} /> Install</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className={cn(
            "mt-4 flex items-start gap-2 rounded-lg p-3 text-sm",
            result.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
          )}>
            {result.type === "success" ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <p className="break-words">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
