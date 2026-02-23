"use client" // Requires useState, useEffect, useCallback for multi-step form state and event handling

import { useState, useEffect, useCallback } from "react"

import { X, Loader2, ArrowLeft, CheckCircle, Youtube, Linkedin, Twitter, MessageCircle, Globe, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ALL_SOURCE_PLATFORMS, ALL_SOURCE_FREQUENCIES, PLATFORM_COLORS } from "@/lib/content-constants"
import { useIdeaSources } from "@/hooks/useIdeaSources"
import type { IdeaSourcePlatform, IdeaSourceFrequency, IdeaSourceValidation } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

type Step = "details" | "validation" | "success"

const ICON_MAP: Record<string, typeof Youtube> = {
  Youtube, Linkedin, Twitter, MessageCircle, Globe, Mail,
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 4) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

export default function CreateIdeaSourceModal({ open, onClose, onCreated }: Props) {
  const { validateSource, createSource, validating } = useIdeaSources()
  const [step, setStep] = useState<Step>("details")
  const [platform, setPlatform] = useState<IdeaSourcePlatform | null>(null)
  const [url, setUrl] = useState("")
  const [comments, setComments] = useState("")
  const [frequency, setFrequency] = useState<IdeaSourceFrequency>("weekly")
  const [validation, setValidation] = useState<IdeaSourceValidation | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("details"); setPlatform(null); setUrl(""); setComments("")
      setFrequency("weekly"); setValidation(null); setError("")
    }
  }, [open])

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  const handleValidate = useCallback(async () => {
    if (!platform || !url.trim()) return
    setError("")
    const result = await validateSource({ platform, url: url.trim(), comments: comments.trim() || undefined })
    if (result) {
      setValidation(result)
      setStep("validation")
    } else {
      setError("Validation failed — please try again")
    }
  }, [platform, url, comments, validateSource])

  const handleCreate = useCallback(async () => {
    if (!platform || !url.trim() || !validation) return
    setCreating(true)
    setError("")
    try {
      await createSource({
        platform, url: url.trim(), comments: comments.trim() || undefined,
        frequency, validationScore: validation.score,
        validationSummary: validation.summary, validationDetails: validation.details,
      })
      setStep("success")
      setTimeout(() => { onCreated?.(); onClose() }, 2000)
    } catch {
      setError("Failed to create source")
    } finally {
      setCreating(false)
    }
  }, [platform, url, comments, frequency, validation, createSource, onCreated, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Create idea source">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {step === "validation" && (
              <button onClick={() => setStep("details")} className="p-1 rounded hover:bg-accent" aria-label="Back">
                <ArrowLeft size={14} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {step === "details" ? "New Idea Source" : step === "validation" ? "Validation Results" : "Source Created"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {step === "details" && <DetailsStep
            platform={platform} url={url} comments={comments} frequency={frequency}
            onPlatform={setPlatform} onUrl={setUrl} onComments={setComments} onFrequency={setFrequency}
            onValidate={handleValidate} validating={validating} error={error}
          />}
          {step === "validation" && validation && <ValidationStep
            validation={validation} onCreate={handleCreate} creating={creating} error={error}
          />}
          {step === "success" && <SuccessStep platform={platform} url={url} />}
        </div>
      </div>
    </div>
  )
}

function DetailsStep({ platform, url, comments, frequency, onPlatform, onUrl, onComments, onFrequency, onValidate, validating, error }: {
  platform: IdeaSourcePlatform | null; url: string; comments: string; frequency: IdeaSourceFrequency
  onPlatform: (p: IdeaSourcePlatform) => void; onUrl: (u: string) => void; onComments: (c: string) => void
  onFrequency: (f: IdeaSourceFrequency) => void; onValidate: () => void; validating: boolean; error: string
}) {
  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Platform</label>
        <div className="grid grid-cols-3 gap-2">
          {ALL_SOURCE_PLATFORMS.map((p) => {
            const Icon = ICON_MAP[p.icon] || Globe
            const colors = PLATFORM_COLORS[p.id]
            const selected = platform === p.id
            return (
              <button key={p.id} onClick={() => !p.comingSoon && onPlatform(p.id)}
                disabled={p.comingSoon}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                  selected ? cn(colors.bg, colors.text, "border-current") : "border-border hover:bg-accent",
                  p.comingSoon && "opacity-40 cursor-not-allowed"
                )}
                aria-label={p.comingSoon ? `${p.label} — coming soon` : p.label}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{p.label}</span>
                {p.comingSoon && <span className="text-[9px] text-muted-foreground ml-auto">Soon</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="source-url" className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
        <input id="source-url" type="url" value={url} onChange={(e) => onUrl(e.target.value)}
          placeholder="https://www.youtube.com/@ChannelName"
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div>
        <label htmlFor="source-comments" className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
        <textarea id="source-comments" value={comments} onChange={(e) => onComments(e.target.value)}
          placeholder="Focus on AI agent and orchestration videos..."
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div>
        <label htmlFor="source-frequency" className="text-xs font-medium text-muted-foreground mb-1 block">Scan Frequency</label>
        <select id="source-frequency" value={frequency} onChange={(e) => onFrequency(e.target.value as IdeaSourceFrequency)}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {ALL_SOURCE_FREQUENCIES.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button onClick={onValidate} disabled={!platform || !url.trim() || validating}
        className="w-full"
      >
        {validating ? <><Loader2 size={14} className="animate-spin" /> Validating...</> : "Validate Source"}
      </Button>
    </>
  )
}

function ValidationStep({ validation, onCreate, creating, error }: {
  validation: IdeaSourceValidation; onCreate: () => void; creating: boolean; error: string
}) {
  const canCreate = validation.score > 3
  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <span className={cn("text-3xl font-bold", scoreColor(validation.score))}>{validation.score}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Summary</h4>
          <p className="text-sm text-foreground">{validation.summary}</p>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Extraction Plan</h4>
          <p className="text-sm text-foreground">{validation.extractionPlan}</p>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Details</h4>
          <p className="text-sm text-muted-foreground">{validation.details}</p>
        </div>
      </div>

      {!canCreate && (
        <p className="text-xs text-red-600">Score too low (minimum 4 required). Go back and try a different source.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button onClick={onCreate} disabled={!canCreate || creating}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Source"}
      </Button>
    </>
  )
}

function SuccessStep({ platform, url }: { platform: IdeaSourcePlatform | null; url: string }) {
  return (
    <div className="text-center py-4">
      <CheckCircle size={32} className="mx-auto text-emerald-600 mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">Source created successfully</p>
      <p className="text-xs text-muted-foreground">{platform} — {url}</p>
      <p className="text-xs text-muted-foreground mt-2">Closing automatically...</p>
    </div>
  )
}
