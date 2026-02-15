"use client" // Requires useState for form fields, interactive submit handler

import { useState } from "react"

import { ALL_STATUSES, ALL_CATEGORIES } from "@/lib/task-constants"

import type { TaskStatus, TaskCategory, TaskPriority } from "@/types/index"

interface CreateTaskManualFormProps {
  onSubmit: (input: {
    name: string; description?: string; status?: TaskStatus
    priority?: TaskPriority; category?: TaskCategory; dueDate?: string
  }) => Promise<void>
}

export default function CreateTaskManualForm({ onSubmit }: CreateTaskManualFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("Medium")
  const [category, setCategory] = useState<TaskCategory>("Personal")
  const [status, setStatus] = useState<TaskStatus>("Backlog")
  const [dueDate, setDueDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), description: description || undefined, status, priority, category, dueDate: dueDate || undefined })
      setName(""); setDescription(""); setDueDate("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Task name..."
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Task name" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2}
          className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Task description" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Priority">
            {(["High", "Medium", "Low"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Category">
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Status">
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Due date" />
        </div>
      </div>
      <button type="submit" disabled={!name.trim() || submitting}
        className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {submitting ? "Creating..." : "Create Task"}
      </button>
    </form>
  )
}
