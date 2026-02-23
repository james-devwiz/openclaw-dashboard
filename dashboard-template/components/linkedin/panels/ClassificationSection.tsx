"use client" // Requires useState for category editing state

import { useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_FILTER_OPTIONS } from "@/lib/linkedin-constants"
import { Section } from "./PanelHelpers"
import type { LinkedInThread, ThreadCategory } from "@/types"

interface ClassificationSectionProps {
  thread: LinkedInThread
  onChangeClassification: (category: ThreadCategory, note: string) => void
}

export default function ClassificationSection({ thread, onChangeClassification }: ClassificationSectionProps) {
  const [editing, setEditing] = useState(false)
  const [newCategory, setNewCategory] = useState(thread.category || "")
  const [note, setNote] = useState("")

  const handleSave = () => {
    if (newCategory && newCategory !== thread.category) {
      onChangeClassification(newCategory as ThreadCategory, note)
    }
    setEditing(false)
    setNote("")
  }

  return (
    <Section title="Classification">
      {editing ? (
        <div className="space-y-2">
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground"
            aria-label="Select category">
            {CATEGORY_FILTER_OPTIONS.filter((o) => o.value !== "all").map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (optional — helps AI learn)" rows={2}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none"
            aria-label="Classification reason" />
          <div className="flex gap-1.5">
            <Button onClick={handleSave} size="sm">Save</Button>
            <Button onClick={() => { setEditing(false); setNote("") }} variant="outline" size="sm">Cancel</Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-1.5">
            {thread.category && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[thread.category] || "")}>
                {CATEGORY_LABELS[thread.category] || thread.category}
              </span>
            )}
            {thread.isSelling && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Spammer
              </span>
            )}
            <button onClick={() => { setNewCategory(thread.category || "other"); setEditing(true) }}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground" aria-label="Change classification">
              <Pencil size={10} aria-hidden="true" />
            </button>
          </div>
          {thread.intent && (
            <p className="text-xs text-muted-foreground mt-1.5">{thread.intent}</p>
          )}
        </div>
      )}
    </Section>
  )
}
