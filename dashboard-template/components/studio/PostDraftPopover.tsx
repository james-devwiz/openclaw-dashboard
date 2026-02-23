"use client" // Requires useState for popover state and draft generation

import { useState } from "react"
import { Sparkles, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
  field: string
  generating: boolean
  onGenerate: (instruction?: string) => Promise<{ draft?: string; drafts?: string[] }>
  onAccept: (value: string) => void
}

export default function PostDraftPopover({ field, generating, onGenerate, onAccept }: Props) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [drafts, setDrafts] = useState<string[]>([])

  const handleGenerate = async () => {
    const result = await onGenerate(instruction || undefined)
    if (result.drafts) setDrafts(result.drafts)
    else if (result.draft) setDrafts([result.draft])
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
        aria-label={`Generate ${field} with AI`}
      >
        <Sparkles size={12} aria-hidden="true" />
        AI
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Generate {field}</span>
        <button onClick={() => { setOpen(false); setDrafts([]) }} aria-label="Close">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional instruction..."
          className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-xs"
        />
        <Button
          onClick={handleGenerate}
          disabled={generating}
          size="sm"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate
        </Button>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {drafts.map((d, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md bg-card border border-border p-2">
              <p className="text-xs text-foreground flex-1 whitespace-pre-wrap">{d}</p>
              <button
                onClick={() => { onAccept(d); setOpen(false); setDrafts([]) }}
                className="shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Use
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
