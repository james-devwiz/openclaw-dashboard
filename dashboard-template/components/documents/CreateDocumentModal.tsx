"use client" // Requires useState for form fields and submit handling

import { useState } from "react"
import { X } from "lucide-react"

import { ALL_CATEGORIES } from "@/lib/document-constants"

import type { DocumentCategory } from "@/types"

interface CreateDocumentModalProps {
  onClose: () => void
  onCreate: (input: { category: DocumentCategory; title: string; content: string; tags: string }) => void
}

export default function CreateDocumentModal({ onClose, onCreate }: CreateDocumentModalProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<DocumentCategory>("Notes")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")

  const handleSubmit = () => {
    if (!title.trim()) return
    onCreate({ category, title: title.trim(), content, tags })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Create document">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">New Document</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Title"
            autoFocus
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
            aria-label="Category"
          >
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Document content (supports Markdown)"
            rows={8}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Content"
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Tags"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
