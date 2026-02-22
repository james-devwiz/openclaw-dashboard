"use client" // Requires useState for save-to-memory modal toggle

import { useState } from "react"
import { Tag, Save } from "lucide-react"

import MarkdownMessage from "@/components/chat/MarkdownMessage"
import SaveToMemoryModal from "@/components/memory/SaveToMemoryModal"
import { CATEGORY_COLORS } from "@/lib/document-constants"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"

import type { Document } from "@/types"

interface DocumentViewContentProps {
  doc: Document
}

export default function DocumentViewContent({ doc }: DocumentViewContentProps) {
  const [showSaveMemory, setShowSaveMemory] = useState(false)
  const colors = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS["Notes"]
  const tags = doc.tags ? doc.tags.split(",").map((t) => t.trim()).filter(Boolean) : []

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <span className={cn("px-2 py-0.5 rounded-full font-medium", colors.bg, colors.text)}>
          {doc.category}
        </span>
        <span>Source: {doc.source}</span>
        <span>{formatRelativeTime(doc.createdAt)}</span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag size={12} className="text-muted-foreground" aria-hidden="true" />
          {tags.map((tag) => (
            <span key={tag} className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="text-sm text-foreground">
        {doc.content ? <MarkdownMessage content={doc.content} /> : <p className="text-muted-foreground">No content.</p>}
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-border">
        <button
          onClick={() => setShowSaveMemory(true)}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          aria-label="Save to memory"
        >
          <Save size={12} /> Save to Memory
        </button>
      </div>

      {showSaveMemory && (
        <SaveToMemoryModal
          content={`# ${doc.title}\n\n${doc.content}`}
          onClose={() => setShowSaveMemory(false)}
        />
      )}
    </div>
  )
}
