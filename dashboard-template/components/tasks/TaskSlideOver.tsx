"use client" // Requires useEffect for keyboard handler, interactive close/update/delete handlers

import { useEffect } from "react"

import { X, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import TaskSlideOverFields from "./TaskSlideOverFields"
import TaskRelationsSection from "./TaskRelationsSection"
import TaskActivitySection from "./TaskActivitySection"
import TaskCommentSection from "./TaskCommentSection"

import type { Task } from "@/types/index"

interface TaskSlideOverProps {
  task: Task | null
  onClose: () => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete?: (taskId: string) => void
  onTaskNavigate?: (task: Task) => void
}

export default function TaskSlideOver({ task, onClose, onUpdate, onDelete, onTaskNavigate }: TaskSlideOverProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (task) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [task, onClose])

  if (!task) return null

  const handleDelete = () => {
    if (!onDelete) return
    if (window.confirm(`Delete "${task.name}"? This cannot be undone.`)) {
      onDelete(task.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Task details">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground truncate">{task.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-[10px]">{task.status}</Badge>
              <Badge variant="secondary" className="text-[10px]">{task.category}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close task details"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <TaskSlideOverFields task={task} onUpdate={onUpdate} />
          <TaskRelationsSection taskId={task.id} goalId={task.goalId} approvalId={task.approvalId} onTaskNavigate={onTaskNavigate} />
          <TaskActivitySection taskId={task.id} />
          <TaskCommentSection taskId={task.id} />
        </div>
      </div>
    </div>
  )
}
