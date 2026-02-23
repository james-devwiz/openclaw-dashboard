"use client" // Requires state for modal form fields

import { useState } from "react"
import { X, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { saveToMemoryApi, getMemoryItemsApi } from "@/services/memory.service"

import type { MemoryItem, MemoryCategory } from "@/types/index"

const CATEGORY_DIRS: Record<MemoryCategory, string> = {
  core: "",
  business: "business/",
  orchestration: "orchestration/",
  memory: "memory/",
  research: "research/",
  projects: "projects/",
  uncategorised: "",
}

interface SaveToMemoryModalProps {
  content: string
  onClose: () => void
  onSaved?: () => void
}

export default function SaveToMemoryModal({ content, onClose, onSaved }: SaveToMemoryModalProps) {
  const [mode, setMode] = useState<"new" | "append">("new")
  const [category, setCategory] = useState<MemoryCategory>("memory")
  const [filename, setFilename] = useState("")
  const [editContent, setEditContent] = useState(content)
  const [existingFiles, setExistingFiles] = useState<MemoryItem[]>([])
  const [selectedFile, setSelectedFile] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function loadExistingFiles() {
    const items = await getMemoryItemsApi()
    setExistingFiles(items)
  }

  function switchMode(m: "new" | "append") {
    setMode(m)
    if (m === "append" && existingFiles.length === 0) loadExistingFiles()
  }

  async function handleSave() {
    setError("")
    setSaving(true)
    try {
      if (mode === "new") {
        if (!filename.trim()) { setError("Filename is required"); setSaving(false); return }
        const sanitized = filename.trim().replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-")
        const dir = CATEGORY_DIRS[category]
        const relativePath = `${dir}${sanitized}.md`
        await saveToMemoryApi({ action: "create", relativePath, content: editContent })
      } else {
        if (!selectedFile) { setError("Select a file"); setSaving(false); return }
        await saveToMemoryApi({ action: "append", relativePath: selectedFile, content: editContent })
      }
      onSaved?.()
      onClose()
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Save to memory">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Save to Memory</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => switchMode("new")} className={cn("px-3 py-1.5 rounded-lg text-sm", mode === "new" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium" : "text-muted-foreground hover:bg-accent")}>New file</button>
          <button onClick={() => switchMode("append")} className={cn("px-3 py-1.5 rounded-lg text-sm", mode === "append" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium" : "text-muted-foreground hover:bg-accent")}>Append to existing</button>
        </div>

        {mode === "new" ? (
          <div className="space-y-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as MemoryCategory)} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" aria-label="Category">
              {Object.keys(CATEGORY_DIRS).map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input type="text" value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="Filename (without .md)" className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" aria-label="Filename" />
          </div>
        ) : (
          <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm" aria-label="Select file">
            <option value="">Select a file...</option>
            {existingFiles.map((f) => <option key={f.relativePath} value={f.relativePath}>{f.relativePath}</option>)}
          </select>
        )}

        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} className="w-full mt-3 px-3 py-2 rounded-lg border border-border bg-card text-sm font-mono resize-none" aria-label="Content to save" />

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
