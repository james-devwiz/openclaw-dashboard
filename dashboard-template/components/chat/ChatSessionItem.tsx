"use client" // Requires onClick, useState for inline rename, hover actions

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Pencil, Trash2, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"

import type { ChatSession } from "@/types/index"

interface ChatSessionItemProps {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export default function ChatSessionItem({
  session, isActive, onSelect, onRename, onDelete,
}: ChatSessionItemProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(session.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  function handleRenameSubmit() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== session.title) {
      onRename(trimmed)
    }
    setIsRenaming(false)
  }

  function handleRenameCancel() {
    setRenameValue(session.title)
    setIsRenaming(false)
  }

  if (isRenaming) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent">
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit()
            if (e.key === "Escape") handleRenameCancel()
          }}
          onBlur={handleRenameSubmit}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          aria-label="Rename session"
        />
        <button onClick={handleRenameSubmit} className="text-green-500 hover:text-green-600" aria-label="Confirm rename">
          <Check size={14} />
        </button>
        <button onClick={handleRenameCancel} className="text-muted-foreground hover:text-foreground" aria-label="Cancel rename">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
        isActive
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-l-2 border-blue-500"
          : "hover:bg-accent text-foreground",
      )}
    >
      <MessageSquare size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground">
          {session.messageCount ?? 0} msgs · {formatRelativeTime(session.updatedAt)}
        </p>
      </div>
      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); setIsRenaming(true) }}
          className="h-6 w-6 p-1"
          aria-label="Rename session"
        >
          <Pencil size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="h-6 w-6 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
          aria-label="Delete session"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </button>
  )
}
