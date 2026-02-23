"use client" // Requires useState/useEffect for file list loading and selection state

import { useState, useEffect, useMemo } from "react"
import { X, Search, FileText, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
import type { MemoryItem } from "@/types/index"

interface FilePickerDialogProps {
  onClose: () => void
  onSelect: (relativePaths: string[]) => void
  existingPaths: string[]
}

export default function FilePickerDialog({ onClose, onSelect, existingPaths }: FilePickerDialogProps) {
  const [files, setFiles] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    apiFetch("/api/memory")
      .then((r) => r.json())
      .then((data) => setFiles(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const existingSet = useMemo(() => new Set(existingPaths), [existingPaths])

  const filtered = useMemo(() => {
    if (!search) return files
    const lower = search.toLowerCase()
    return files.filter((f) =>
      f.title.toLowerCase().includes(lower) || f.relativePath.toLowerCase().includes(lower)
    )
  }, [files, search])

  const toggleFile = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleAdd = () => {
    onSelect(Array.from(selected))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[80vh] rounded-xl bg-card border border-border shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Add Workspace Files</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search files..."
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No files found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((file) => {
                const alreadyLinked = existingSet.has(file.relativePath)
                const isSelected = selected.has(file.relativePath)
                return (
                  <button
                    key={file.relativePath}
                    onClick={() => !alreadyLinked && toggleFile(file.relativePath)}
                    disabled={alreadyLinked}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      alreadyLinked
                        ? "opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-accent"
                    )}
                  >
                    <div className={cn(
                      "grid size-5 place-content-center rounded border",
                      isSelected ? "bg-blue-600 border-blue-600" : "border-border"
                    )}>
                      {(isSelected || alreadyLinked) && <Check size={12} className="text-white" />}
                    </div>
                    <FileText size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{file.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{file.relativePath}</p>
                    </div>
                    {alreadyLinked && (
                      <span className="text-xs text-muted-foreground shrink-0">Already linked</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {selected.size} file{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selected.size === 0}
            >
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
