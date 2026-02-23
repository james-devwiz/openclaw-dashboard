"use client" // Requires useState for editable fields, useRef for debounce

import { useState, useRef, useEffect } from "react"

import ProgressRing from "@/components/ui/ProgressRing"

import type { Goal, GoalStatus, GoalCategory } from "@/types/index"

const GOAL_STATUSES: GoalStatus[] = ["Active", "Achieved", "Paused", "Abandoned"]
const GOAL_CATEGORIES: GoalCategory[] = ["Personal", "System", "Business A", "Business B", "Business C"]

interface GoalSlideOverFieldsProps {
  goal: Goal
  onUpdate: (goalId: string, updates: Partial<Goal>) => void
}

export default function GoalSlideOverFields({ goal, onUpdate }: GoalSlideOverFieldsProps) {
  const [name, setName] = useState(goal.name)
  const [description, setDescription] = useState(goal.description)
  const [metric, setMetric] = useState(goal.metric)
  const [currentValue, setCurrentValue] = useState(goal.currentValue)
  const [targetValue, setTargetValue] = useState(goal.targetValue)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setName(goal.name); setDescription(goal.description); setMetric(goal.metric)
    setCurrentValue(goal.currentValue); setTargetValue(goal.targetValue)
  }, [goal.id, goal.name, goal.description, goal.metric, goal.currentValue, goal.targetValue])

  const debouncedUpdate = (field: string, value: string | number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { onUpdate(goal.id, { [field]: value }) }, 500)
  }

  const variant = goal.progress >= 100 ? "success" : goal.progress >= 50 ? "default" : "warning"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); debouncedUpdate("name", e.target.value) }}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal name"
          />
        </div>
        <ProgressRing value={goal.progress} size="md" variant={variant} />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); debouncedUpdate("description", e.target.value) }}
          className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          rows={3}
          aria-label="Goal description"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select
            value={goal.status}
            onChange={(e) => onUpdate(goal.id, { status: e.target.value as GoalStatus })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal status"
          >
            {GOAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select
            value={goal.category}
            onChange={(e) => onUpdate(goal.id, { category: e.target.value as GoalCategory })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal category"
          >
            {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          <select
            value={goal.priority}
            onChange={(e) => onUpdate(goal.id, { priority: e.target.value as "High" | "Medium" | "Low" })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal priority"
          >
            {(["High", "Medium", "Low"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target Date</label>
          <input
            type="date"
            value={goal.targetDate || ""}
            onChange={(e) => onUpdate(goal.id, { targetDate: e.target.value })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal target date"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Progress (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={goal.progress}
            onChange={(e) => onUpdate(goal.id, { progress: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal progress percentage"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Metric</label>
          <input
            value={metric}
            onChange={(e) => { setMetric(e.target.value); debouncedUpdate("metric", e.target.value) }}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Goal metric"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Current Value</label>
          <input
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); debouncedUpdate("currentValue", e.target.value) }}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Current value"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target Value</label>
          <input
            value={targetValue}
            onChange={(e) => { setTargetValue(e.target.value); debouncedUpdate("targetValue", e.target.value) }}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Target value"
          />
        </div>
      </div>
    </div>
  )
}
