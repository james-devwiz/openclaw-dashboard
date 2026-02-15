"use client" // Requires useState for response text and rejection reason prompt

import { useState } from "react"

import { Send } from "lucide-react"

import type { ApprovalStatus } from "@/types/index"

interface ApprovalResponseInputProps {
  onRespond: (status: ApprovalStatus, response: string) => void
}

export default function ApprovalResponseInput({ onRespond }: ApprovalResponseInputProps) {
  const [text, setText] = useState("")
  const [rejectPrompt, setRejectPrompt] = useState(false)

  const handleQuickAction = (status: ApprovalStatus) => {
    onRespond(status, text)
    setText("")
  }

  const handleReject = () => {
    if (text.trim()) {
      onRespond("Rejected", text)
      setText("")
      setRejectPrompt(false)
    } else {
      setRejectPrompt(true)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setRejectPrompt(false) }}
          placeholder={rejectPrompt ? "Please provide a reason for rejecting..." : "Type your response..."}
          rows={3}
          className={`w-full resize-none rounded-xl border bg-card p-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
            rejectPrompt
              ? "border-red-300 focus:ring-red-500/20 placeholder:text-red-400"
              : "border-border focus:ring-claw-blue/20"
          }`}
        />
        <div className="absolute bottom-2 right-2">
          <button
            onClick={() => { onRespond("Responded", text); setText("") }}
            disabled={!text.trim()}
            className="p-2 rounded-lg bg-claw-blue text-white disabled:opacity-50 hover:bg-claw-blue/90 transition-colors"
            aria-label="Send response"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {rejectPrompt && (
        <p className="text-xs text-red-500">A reason is required so the AI can learn from this decision.</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuickAction("Approved")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => handleQuickAction("Deferred")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
        >
          Defer
        </button>
      </div>
    </div>
  )
}
