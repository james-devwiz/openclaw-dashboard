"use client" // Requires useState for comment input, useComments for data

import { useState } from "react"
import { MessageSquare, Send } from "lucide-react"
import { useComments } from "@/hooks/useComments"
import TaskCommentItem from "./TaskCommentItem"

interface TaskCommentSectionProps {
  taskId: string
}

export default function TaskCommentSection({ taskId }: TaskCommentSectionProps) {
  const { comments, loading, addComment, removeComment } = useComments(taskId)
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
          {comments.map((c) => (
            <TaskCommentItem key={c.id} comment={c} onDelete={removeComment} />
          ))}
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
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || submitting}
          className="self-end p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add comment"
        >
          <Send size={14} />
        </button>
      </div>
    </section>
  )
}
