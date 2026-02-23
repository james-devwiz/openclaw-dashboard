"use client" // Requires useState for comment input, useLeadComments for data

import { useState } from "react"
import { MessageSquare, Send, User, Zap, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLeadComments } from "@/hooks/useLeadComments"
import { formatRelativeTime } from "@/lib/utils"

import type { LeadComment } from "@/types/index"

interface LeadCommentSectionProps {
  leadId: string
}

export default function LeadCommentSection({ leadId }: LeadCommentSectionProps) {
  const { comments, loading, addComment, removeComment } = useLeadComments(leadId)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return
    setSubmitting(true)
    try {
      await addComment(input.trim())
      setInput("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} className="text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-medium text-foreground">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : (
        <div className="space-y-4 mb-4">
          {comments.map((c) => <CommentItem key={c.id} comment={c} onDelete={removeComment} />)}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No comments yet</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
          placeholder="Add a comment..."
          className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          rows={2}
          aria-label="Comment input"
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || submitting}
          size="icon"
          className="self-end"
          aria-label="Add comment"
        >
          <Send size={14} />
        </Button>
      </div>
    </section>
  )
}

function CommentItem({ comment, onDelete }: { comment: LeadComment; onDelete: (id: string) => void }) {
  const isUser = comment.source === "user"
  return (
    <div className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
        {isUser ? (
          <User size={14} className="text-muted-foreground" aria-hidden="true" />
        ) : (
          <Zap size={14} className="text-blue-500" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{isUser ? "You" : "AI Assistant"}</span>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
          <button
            onClick={() => onDelete(comment.id)}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-all"
            aria-label="Delete comment"
          >
            <Trash2 size={12} className="text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  )
}
