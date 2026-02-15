"use client" // Requires interactive delete handler

import { User, Zap, Trash2 } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { SITE_CONFIG } from "@/lib/site-config"

import type { Comment } from "@/types/index"

interface TaskCommentItemProps {
  comment: Comment
  onDelete: (id: string) => void
}

export default function TaskCommentItem({ comment, onDelete }: TaskCommentItemProps) {
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
          <span className="text-xs font-medium text-foreground">{isUser ? "You" : SITE_CONFIG.aiName}</span>
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
