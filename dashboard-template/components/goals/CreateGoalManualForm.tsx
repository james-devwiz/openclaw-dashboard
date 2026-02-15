"use client" // Requires useState for form fields, interactive submit handler

import { useState } from "react"

import { SITE_CONFIG } from "@/lib/site-config"

import type { GoalCategory } from "@/types/index"

interface CreateGoalManualFormProps {
  onSubmit: (input: {
    name: string; description?: string; category?: string
    targetDate?: string; metric?: string; targetValue?: string; priority?: string
  }) => Promise<void>
}

export default function CreateGoalManualForm({ onSubmit }: CreateGoalManualFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<GoalCategory>("Personal")
  const [priority, setPriority] = useState("Medium")
  const [targetDate, setTargetDate] = useState("")
  const [metric, setMetric] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(), description: description || undefined, category,
        targetDate: targetDate || undefined, metric: metric || undefined,
        targetValue: targetValue || undefined, priority,
      })
      setName(""); setDescription(""); setTargetDate(""); setMetric(""); setTargetValue("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Goal name..."
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Goal name" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2}
          className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Goal description" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Category">
            {[...SITE_CONFIG.goalCategories].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Priority">
            {["High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target Date</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Target date" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Metric</label>
          <input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="e.g. Revenue"
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="Metric" />
        </div>
      </div>
      <button type="submit" disabled={!name.trim() || submitting}
        className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {submitting ? "Creating..." : "Create Goal"}
      </button>
    </form>
  )
}
