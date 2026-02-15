"use client" // Requires useState, useEffect, useRef for chat modal state and SSE streaming

import { useState, useEffect, useRef } from "react"

import { X, Send, Loader2 } from "lucide-react"
import { useCron } from "@/hooks/useCron"
import { SITE_CONFIG } from "@/lib/site-config"

interface CreateRecurringModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateRecurringModal({ open, onClose }: CreateRecurringModalProps) {
  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const { refetch } = useCron()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setResponse("")
    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), topic: "tasks" }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) { setResponse(`Error communicating with ${SITE_CONFIG.aiName}.`); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue
          try {
            const parsed = JSON.parse(trimmed.slice(6))
            if (parsed.content) {
              accumulated += parsed.content
              setResponse(accumulated)
            }
          } catch { /* skip malformed */ }
        }
      }

      refetch()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setResponse("Error: failed to get response.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Create recurring task">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Recurring Task</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {`Describe the recurring task and ${SITE_CONFIG.aiName} will create a cron job for you.`}
          </p>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="e.g. Every morning at 7am, send a daily brief to Telegram..."
              className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              rows={3}
              aria-label={`Recurring task description for ${SITE_CONFIG.aiName}`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="self-end p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={`Send to ${SITE_CONFIG.aiName}`}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          {response && (
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
              {response}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
