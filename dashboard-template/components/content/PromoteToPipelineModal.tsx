"use client" // Requires useState for form state and loading indicator

import { useState } from "react"

import { X, Loader2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ALL_CONTENT_FORMATS, CONTENT_FORMAT_COLORS } from "@/lib/content-constants"

import type { ContentItem, ContentFormat, ContentType } from "@/types/index"

const CONTENT_TYPES: ContentType[] = ["YouTube Script", "Newsletter", "Blog Post", "LinkedIn Content"]

interface PromoteToPipelineModalProps {
  item: ContentItem
  open: boolean
  onClose: () => void
  onPromote: (contentId: string, formats: ContentFormat[], contentType: string) => Promise<unknown>
}

export default function PromoteToPipelineModal({ item, open, onClose, onPromote }: PromoteToPipelineModalProps) {
  const [contentType, setContentType] = useState<ContentType>(CONTENT_TYPES[0])
  const [formats, setFormats] = useState<Set<ContentFormat>>(() => new Set(item.contentFormats || []))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const toggleFormat = (f: ContentFormat) => {
    setFormats((prev) => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  const handleSubmit = async () => {
    if (formats.size === 0 || loading) return
    setLoading(true)
    try {
      await onPromote(item.id, Array.from(formats), contentType)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose() }, 1500)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Promote to pipeline">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers size={18} className="text-purple-500" aria-hidden="true" />
            Promote to Pipeline
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Idea</label>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
          </div>

          <div>
            <label htmlFor="pipeline-content-type" className="block text-xs font-medium text-muted-foreground mb-1">Content Type</label>
            <select
              id="pipeline-content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Content Formats <span className="text-muted-foreground/60">(one pipeline item per format)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CONTENT_FORMATS.map((f) => {
                const c = CONTENT_FORMAT_COLORS[f]
                const active = formats.has(f)
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFormat(f)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-colors",
                      active
                        ? cn(c.bg, c.text, "border-transparent font-medium")
                        : "border-border text-muted-foreground hover:border-purple-500/30"
                    )}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={formats.size === 0 || loading || success}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" />Creating...</>
            ) : success ? (
              "Pipeline items created"
            ) : (
              `Create ${formats.size} Pipeline Item${formats.size !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
