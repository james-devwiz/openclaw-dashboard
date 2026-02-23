"use client" // Requires useState for editable fields, useRef for debounce timers

import { useState, useRef, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { ALL_STATUSES, ALL_CATEGORIES, ALL_COMPLEXITIES, ALL_ASSIGNEES } from "@/lib/task-constants"

import type { Task, TaskStatus, TaskCategory, TaskPriority, TaskComplexity, TaskAssignee } from "@/types/index"

interface TaskSlideOverFieldsProps {
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => void
}

export default function TaskSlideOverFields({ task, onUpdate }: TaskSlideOverFieldsProps) {
  const [name, setName] = useState(task.name)
  const [description, setDescription] = useState(task.description || "")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => { setName(task.name); setDescription(task.description || "") }, [task.id, task.name, task.description])

  const debouncedUpdate = (field: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onUpdate(task.id, { [field]: value })
    }, 500)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Name</label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); debouncedUpdate("name", e.target.value) }}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Task name"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); debouncedUpdate("description", e.target.value) }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = "auto"
            el.style.height = `${el.scrollHeight}px`
          }}
          className="w-full resize-y rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[80px]"
          rows={4}
          aria-label="Task description"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select
            value={task.status}
            onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Task status"
          >
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
          <select
            value={task.assignee || ""}
            onChange={(e) => onUpdate(task.id, { assignee: (e.target.value || undefined) as TaskAssignee })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Task assignee"
          >
            <option value="">Unassigned</option>
            {ALL_ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          <select
            value={task.priority}
            onChange={(e) => onUpdate(task.id, { priority: e.target.value as TaskPriority })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Task priority"
          >
            {(["High", "Medium", "Low"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Complexity</label>
          <select
            value={task.complexity || "Moderate"}
            onChange={(e) => onUpdate(task.id, { complexity: e.target.value as TaskComplexity })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Task complexity"
          >
            {ALL_COMPLEXITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Estimated Time (min)</label>
          <input
            type="number"
            min={0}
            value={task.estimatedMinutes || ""}
            onChange={(e) => onUpdate(task.id, { estimatedMinutes: parseInt(e.target.value) || 0 })}
            placeholder="30"
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Estimated minutes"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select
            value={task.category}
            onChange={(e) => onUpdate(task.id, { category: e.target.value as TaskCategory })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Task category"
          >
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
          <input
            type="date"
            value={task.dueDate || ""}
            onChange={(e) => onUpdate(task.id, { dueDate: e.target.value })}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Task due date"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Created</label>
          <p className="text-sm text-foreground px-3 py-2">
            {new Date(task.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Source</label>
          <Badge variant="secondary" className="text-xs">{task.source}</Badge>
        </div>
      </div>
    </div>
  )
}
