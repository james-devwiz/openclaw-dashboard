"use client" // Requires useState for response text and rejection reason prompt

import { useState } from "react"

import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { ApprovalStatus } from "@/types/index"

interface ApprovalResponseInputProps {
  onRespond: (status: ApprovalStatus, response: string) => void
  onRevise: (feedback: string) => void
  revising?: boolean
}

export default function ApprovalResponseInput({ onRespond, onRevise, revising }: ApprovalResponseInputProps) {
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

  const handleRevise = () => {
    if (!text.trim() || revising) return
    onRevise(text)
    setText("")
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setRejectPrompt(false) }}
          placeholder={rejectPrompt ? "Please provide a reason for rejecting..." : "Give feedback to revise this proposal..."}
          rows={3}
          disabled={revising}
          className={cn(
            "w-full resize-none rounded-xl border bg-card p-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors disabled:opacity-50",
            rejectPrompt
              ? "border-red-300 focus:ring-red-500/20 placeholder:text-red-400"
              : "border-border focus:ring-claw-blue/20"
          )}
        />
        <div className="absolute bottom-2 right-2">
          <Button
            size="icon"
            onClick={handleRevise}
            disabled={!text.trim() || revising}
            aria-label="Send feedback for AI revision"
          >
            {revising ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>

      {rejectPrompt && (
        <p className="text-xs text-red-500">A reason is required so the AI can learn from this decision.</p>
      )}

      {revising && (
        <p className="text-xs text-blue-500 animate-pulse">AI is revising the proposal based on your feedback...</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickAction("Approved")}
          disabled={revising}
          className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
        >
          Approve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReject}
          disabled={revising}
          className="bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25"
        >
          Reject
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickAction("Deferred")}
          disabled={revising}
          className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
        >
          Defer
        </Button>
      </div>
    </div>
  )
}
