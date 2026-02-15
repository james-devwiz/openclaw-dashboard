"use client" // Requires useState for active tab, useEffect for keyboard handler

import { useState, useEffect } from "react"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SITE_CONFIG } from "@/lib/site-config"
import CreateTaskManualForm from "./CreateTaskManualForm"
import CreateTaskChatForm from "./CreateTaskChatForm"

import type { TaskStatus, TaskPriority, TaskCategory } from "@/types/index"

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  onCreateManual: (input: {
    name: string; description?: string; status?: TaskStatus
    priority?: TaskPriority; category?: TaskCategory; dueDate?: string
  }) => Promise<void>
  onChatCreated: () => void
}

const TABS = [
  { id: "manual", label: "Manual" },
  { id: "chat", label: `Chat with ${SITE_CONFIG.aiNameShort}` },
]

export default function CreateTaskModal({ open, onClose, onCreateManual, onChatCreated }: CreateTaskModalProps) {
  const [tab, setTab] = useState("manual")

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Create task">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Task</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mx-4 mt-4" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                tab === t.id ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              role="tab"
              aria-selected={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4" role="tabpanel">
          {tab === "manual" ? (
            <CreateTaskManualForm onSubmit={async (input) => { await onCreateManual(input); onClose() }} />
          ) : (
            <CreateTaskChatForm onCreated={() => { onChatCreated(); onClose() }} />
          )}
        </div>
      </div>
    </div>
  )
}
