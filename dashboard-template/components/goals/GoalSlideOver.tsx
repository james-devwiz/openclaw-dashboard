"use client" // Requires useEffect for keyboard handler, interactive close/update handlers

import { useEffect } from "react"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import GoalSlideOverFields from "./GoalSlideOverFields"

import type { Goal } from "@/types/index"

interface GoalSlideOverProps {
  goal: Goal | null
  onClose: () => void
  onUpdate: (goalId: string, updates: Partial<Goal>) => void
}

export default function GoalSlideOver({ goal, onClose, onUpdate }: GoalSlideOverProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (goal) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [goal, onClose])

  if (!goal) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Goal details">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground truncate">{goal.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-[10px]">{goal.status}</Badge>
              <Badge variant="secondary" className="text-[10px]">{goal.category}</Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0 ml-2"
            aria-label="Close goal details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <GoalSlideOverFields goal={goal} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  )
}
