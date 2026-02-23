"use client" // Requires onClick handler for goal selection

import { Calendar, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import ProgressRing from "@/components/ui/ProgressRing"
import { cn } from "@/lib/utils"

import type { Goal } from "@/types/index"

const CATEGORY_VARIANTS: Record<string, "default" | "success" | "warning" | "secondary"> = {
  Personal: "secondary",
  System: "default",
  "Business A": "default",
  "Business B": "success",
  "Business C": "warning",
}

interface GoalCardProps {
  goal: Goal
  taskCount: number
  recurringCount: number
  isSelected: boolean
  onSelect: (goalId: string) => void
}

export default function GoalCard({ goal, taskCount, recurringCount, isSelected, onSelect }: GoalCardProps) {
  const variant = goal.progress >= 100 ? "success" : goal.progress >= 50 ? "default" : "warning"

  return (
    <button
      onClick={() => onSelect(goal.id)}
      className={cn(
        "w-full text-left p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200",
        isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-border"
      )}
      aria-pressed={isSelected}
      aria-label={`Goal: ${goal.name}, ${goal.progress}% complete`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
            <Badge variant={CATEGORY_VARIANTS[goal.category] || "secondary"} className="text-[10px]">
              {goal.category}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">{goal.name}</h3>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span>{taskCount} {taskCount === 1 ? "task" : "tasks"}</span>
            {recurringCount > 0 && (
              <span>{recurringCount} recurring</span>
            )}
            {goal.targetDate && (
              <span className="flex items-center gap-1">
                <Calendar size={10} aria-hidden="true" />
                {new Date(goal.targetDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
        <ProgressRing value={goal.progress} size="sm" variant={variant} />
      </div>
    </button>
  )
}
