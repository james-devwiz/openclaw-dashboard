"use client" // Requires interactive close/edit/save handlers and state

import { useState } from "react"
import { X, Pencil, Save, XCircle } from "lucide-react"
import Markdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatRelativeTime, getStaleness } from "@/lib/utils"
import MemoryEditor from "./MemoryEditor"
import MemoryHistory from "./MemoryHistory"

import type { MemoryItem } from "@/types/index"

const STALENESS_DOT: Record<string, string> = {
  fresh: "bg-green-500",
  aging: "bg-amber-500",
  stale: "bg-red-500",
}

interface MemoryDetailProps {
  item: MemoryItem | null
  onClose: () => void
  onSave?: (encodedPath: string, content: string) => Promise<void>
  referencedBy?: string[]
  onSelectRef?: (relativePath: string) => void
}

export default function MemoryDetail({ item, onClose, onSave, referencedBy, onSelectRef }: MemoryDetailProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  if (!item) return null

  const staleness = getStaleness(item.lastModified)

  function startEdit() {
    setDraft(item!.content)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setDraft("")
  }

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(item!.id, draft)
      setEditing(false)
    } catch (err) {
      console.error("Save failed:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Memory file viewer">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-card border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground capitalize truncate">{item.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] capitalize">{item.category}</Badge>
              <span className={cn("w-2 h-2 rounded-full", STALENESS_DOT[staleness.level])} title={`${staleness.days}d old`} />
              <span className="text-xs text-muted-foreground">{formatRelativeTime(item.lastModified)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <Button variant="ghost" size="icon" onClick={handleSave} disabled={saving} className="text-green-600" aria-label="Save changes">
                  <Save size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel editing">
                  <XCircle size={16} />
                </Button>
              </>
            ) : onSave ? (
              <Button variant="ghost" size="icon" onClick={startEdit} aria-label="Edit file">
                <Pencil size={16} />
              </Button>
            ) : null}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close file viewer">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {editing ? (
            <MemoryEditor content={draft} onChange={setDraft} />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{item.content}</Markdown>
            </div>
          )}

          {!editing && referencedBy && referencedBy.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Referenced by</h4>
              <div className="flex flex-wrap gap-2">
                {referencedBy.map((ref) => (
                  <button
                    key={ref}
                    onClick={() => onSelectRef?.(ref)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!editing && <MemoryHistory encodedPath={item.id} />}
        </div>
      </div>
    </div>
  )
}
