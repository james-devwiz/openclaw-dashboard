"use client" // Requires useState for instruction input, generating state, draft variants + history

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Loader2, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getDraftHistoryApi, markDraftUsedApi } from "@/services/linkedin.service"
import DraftHistoryList from "./DraftHistoryList"

import type { DraftHistoryEntry } from "@/types"

interface DraftPanelProps {
  threadId: string
  onBack: () => void
  onGenerateDraft?: (threadId: string, instruction?: string) => Promise<string[]>
  onUseDraft: (text: string) => void
}

export default function DraftPanel({ threadId, onBack, onGenerateDraft, onUseDraft }: DraftPanelProps) {
  const [instruction, setInstruction] = useState("")
  const [drafts, setDrafts] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [history, setHistory] = useState<DraftHistoryEntry[]>([])

  const fetchHistory = useCallback(async () => {
    try {
      const entries = await getDraftHistoryApi(threadId)
      setHistory(entries)
    } catch { /* non-critical */ }
  }, [threadId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleGenerate = async () => {
    if (!onGenerateDraft || generating) return
    setGenerating(true)
    try {
      const result = await onGenerateDraft(threadId, instruction || undefined)
      setDrafts(result)
      fetchHistory()
    } finally {
      setGenerating(false)
    }
  }

  const handleUseHistoryDraft = async (text: string, entryId: string, variantIndex: number) => {
    onUseDraft(text)
    try {
      await markDraftUsedApi(entryId, variantIndex)
      fetchHistory()
    } catch { /* non-critical */ }
  }

  return (
    <div className="w-72 border-l border-border overflow-y-auto p-4 space-y-4 shrink-0">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft size={12} /> Back
      </Button>

      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AI Draft</h3>

      <div className="space-y-2">
        <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional: what should the reply focus on?"
          rows={2}
          className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none"
          aria-label="Draft instruction" />
        <Button onClick={handleGenerate} disabled={generating} size="sm" className="w-full">
          {generating ? <Loader2 size={12} className="animate-spin" /> : null}
          {generating ? "Generating..." : "Generate Drafts"}
        </Button>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Select a draft:</p>
          {drafts.map((d, i) => (
            <button key={i} onClick={() => onUseDraft(d)}
              className="w-full text-left p-2.5 text-xs rounded-lg border border-border bg-background hover:bg-accent transition-colors group relative">
              {d}
              <span className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Check size={10} className="text-green-600" />
              </span>
            </button>
          ))}
        </div>
      )}

      <DraftHistoryList history={history} onUseDraft={handleUseHistoryDraft} />
    </div>
  )
}
