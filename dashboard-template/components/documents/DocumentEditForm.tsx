"use client" // Requires useState for form field state management

import { useState } from "react"

import { ALL_CATEGORIES } from "@/lib/document-constants"

import type { Document, DocumentCategory } from "@/types"

interface DocumentEditFormProps {
  doc: Document
  onSave: (updates: Partial<Pick<Document, "category" | "title" | "content" | "tags">>) => void
  onCancel: () => void
}

export default function DocumentEditForm({ doc, onSave, onCancel }: DocumentEditFormProps) {
  const [title, setTitle] = useState(doc.title)
  const [category, setCategory] = useState<DocumentCategory>(doc.category)
  const [content, setContent] = useState(doc.content)
  const [tags, setTags] = useState(doc.tags)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), category, content, tags })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Title"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
          aria-label="Category"
        >
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Content (Markdown)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Content"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Tags"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
