"use client" // Requires useState for draft text, useEffect for voice transcript + external draft

import { useState, useEffect } from "react"
import { Send, Mic, MicOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useVoiceInput } from "@/hooks/useVoiceInput"
import { useToast } from "@/components/ui/Toast"

interface DraftComposerProps {
  threadId: string
  onSend: (content: string) => Promise<boolean>
  externalDraft?: string
  onDraftConsumed?: () => void
}

export default function DraftComposer({
  threadId, onSend, externalDraft, onDraftConsumed,
}: DraftComposerProps) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  const { isListening, transcript, supported, startListening, stopListening } = useVoiceInput()

  // Append voice transcript to draft
  useEffect(() => {
    if (transcript) setDraft((prev) => prev + transcript)
  }, [transcript])

  // Accept external draft from DraftPanel "Use this" button
  useEffect(() => {
    if (externalDraft) {
      setDraft(externalDraft)
      onDraftConsumed?.()
    }
  }, [externalDraft, onDraftConsumed])

  // Reset draft when switching threads
  useEffect(() => {
    setDraft("")
  }, [threadId])

  const handleSend = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      const ok = await onSend(draft.trim())
      if (ok) setDraft("")
    } catch {
      toast("Failed to send message — please try again", "error")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type a message..."}
          rows={2}
          className={cn(
            "flex-1 resize-none rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30",
            isListening ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-border bg-background"
          )}
          aria-label="Message input"
        />
        <div className="flex flex-col gap-1">
          {supported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                isListening
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 animate-pulse"
                  : "border-border hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              aria-label={isListening ? "Stop listening" : "Start voice input"}>
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <Button onClick={handleSend} disabled={!draft.trim() || sending} size="icon"
            aria-label="Send message">
            <Send size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
