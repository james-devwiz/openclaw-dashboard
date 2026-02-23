"use client" // Requires useState for comment input, useRef for prev status tracking, useEffect for auto-review

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useComments } from "@/hooks/useComments"
import { requestReviewSummaryApi, requestReviewReplyApi } from "@/services/comment.service"
import TaskCommentItem from "./TaskCommentItem"

import type { TaskStatus } from "@/types"

interface TaskCommentSectionProps {
  taskId: string
  taskStatus: TaskStatus
}

export default function TaskCommentSection({ taskId, taskStatus }: TaskCommentSectionProps) {
  const { comments, loading, addComment, removeComment, refetch } = useComments(taskId)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const prevStatusRef = useRef<TaskStatus>(taskStatus)
  const reviewTriggeredRef = useRef(false)

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = taskStatus

    if (taskStatus === "Needs Review" && prev !== "Needs Review" && !reviewTriggeredRef.current) {
      reviewTriggeredRef.current = true
      setAiThinking(true)
      requestReviewSummaryApi(taskId)
        .then(() => refetch())
        .catch((err) => console.error("Auto-review failed:", err))
        .finally(() => setAiThinking(false))
    }

    if (taskStatus !== "Needs Review") {
      reviewTriggeredRef.current = false
    }
  }, [taskStatus, taskId, refetch])

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return
    const message = input.trim()
    setSubmitting(true)
    try {
      await addComment(message)
      setInput("")

      if (taskStatus === "Needs Review") {
        setAiThinking(true)
        try {
          await requestReviewReplyApi(taskId, message)
          await refetch()
        } catch (err) {
          console.error("Auto-reply failed:", err)
        } finally {
          setAiThinking(false)
        }
      }
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

      {aiThinking && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Loader2 size={14} className="text-blue-500 animate-spin" />
          <span className="text-xs text-blue-400">AI Assistant is reviewing...</span>
        </div>
      )}

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
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim() || submitting}
          className="self-end"
          aria-label="Add comment"
        >
          <Send size={14} />
        </Button>
      </div>
    </section>
  )
}
