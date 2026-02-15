"use client" // Requires useState, useRef for chat state and streaming response

import { useState, useRef } from "react"

import { Send, Loader2 } from "lucide-react"
import { SITE_CONFIG } from "@/lib/site-config"

interface CreateTaskChatFormProps {
  onCreated: () => void
}

export default function CreateTaskChatForm({ onCreated }: CreateTaskChatFormProps) {
  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

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

      onCreated()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setResponse("Error: failed to get response.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {`Describe the task and ${SITE_CONFIG.aiName} will create it for you.`}
      </p>
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Describe the task..."
          className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          rows={3}
          aria-label={`Task description for ${SITE_CONFIG.aiName}`}
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
  )
}
