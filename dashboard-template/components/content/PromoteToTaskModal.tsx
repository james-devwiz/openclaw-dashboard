"use client" // Requires useState for form state and loading indicator

import { useState } from "react"

import { X, Loader2, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ALL_CATEGORIES } from "@/lib/task-constants"

import type { ContentItem, TaskCategory } from "@/types/index"

interface PromoteToTaskModalProps {
  item: ContentItem
  open: boolean
  onClose: () => void
  onPromote: (contentId: string, opts: { category?: string; priority?: string; comment?: string }) => Promise<{ taskId: string }>
}

export default function PromoteToTaskModal({ item, open, onClose, onPromote }: PromoteToTaskModalProps) {
  const [category, setCategory] = useState<TaskCategory>(ALL_CATEGORIES[0])
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onPromote(item.id, { category, priority, comment: comment.trim() || undefined })
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose() }, 1500)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Promote idea to task">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ArrowUpRight size={18} className="text-blue-500" aria-hidden="true" />
            Promote to Task
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Idea</label>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
          </div>

          <div>
            <label htmlFor="promote-category" className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
            <select
              id="promote-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="promote-priority" className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
            <select
              id="promote-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label htmlFor="promote-comment" className="block text-xs font-medium text-muted-foreground mb-1">
              Comment <span className="text-muted-foreground/60">(optional — AI will enrich the task description)</span>
            </label>
            <textarea
              id="promote-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What should be done with this idea? Any specific focus areas?"
              className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || success}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" />Generating task...</>
            ) : success ? (
              "Task created"
            ) : (
              "Promote to Task"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
