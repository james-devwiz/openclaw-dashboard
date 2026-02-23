"use client" // Requires useState, useRef for input state and keyboard interaction

import { useState, useRef } from "react"
import { Send, Loader2, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea"

interface LeadChatInputProps {
  isStreaming: boolean
  onSend: (message: string) => void
}

const SUGGESTIONS = [
  "Find 5 AU business coaches doing $1M+ with no AI offer",
  "Write a cold email sequence for my top 3 leads",
  "Who should I call first today?",
  "Show me pipeline stats by business",
]

export default function LeadChatInput({ isStreaming, onSend }: LeadChatInputProps) {
  const [input, setInput] = useState("")
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 36, maxHeight: 200 })

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    onSend(text)
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "36px"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="pt-3">
      {/* Suggestions */}
      {!input && (
        <div className="flex flex-wrap gap-2 mb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={isStreaming}
              className="px-3 py-1.5 text-xs rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg p-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder="Start a campaign, ask about leads, or get outreach copy..."
          disabled={isStreaming}
          rows={1}
          className="w-full resize-none bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          style={{ minHeight: 36, maxHeight: 200 }}
        />
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-accent/50 text-xs text-muted-foreground">
            <UserPlus size={12} aria-hidden="true" />
            Lead Generation
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              input.trim() && !isStreaming
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-muted text-muted-foreground"
            )}
            aria-label="Send message"
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
