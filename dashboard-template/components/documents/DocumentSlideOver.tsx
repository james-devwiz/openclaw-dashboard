"use client" // Requires useState for edit mode toggle, useEffect for keyboard handler

import { useState, useEffect } from "react"
import { X, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import DocumentViewContent from "./DocumentViewContent"
import DocumentEditForm from "./DocumentEditForm"

import type { Document } from "@/types"

interface DocumentSlideOverProps {
  doc: Document | null
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Pick<Document, "category" | "title" | "content" | "tags" | "folder" | "projectId" | "agentId">>) => void
  onDelete: (id: string) => void
}

export default function DocumentSlideOver({ doc, onClose, onUpdate, onDelete }: DocumentSlideOverProps) {
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setEditing(false)
  }, [doc?.id])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (doc) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [doc, onClose])

  if (!doc) return null

  const handleSave = (updates: Partial<Pick<Document, "category" | "title" | "content" | "tags" | "folder" | "projectId" | "agentId">>) => {
    onUpdate(doc.id, updates)
    setEditing(false)
  }

  const handleDelete = () => {
    onDelete(doc.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Document details">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground truncate flex-1 min-w-0">
            {doc.title}
          </h2>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!editing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(true)}
                  aria-label="Edit document"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-red-500"
                  aria-label="Delete document"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {editing ? (
            <DocumentEditForm doc={doc} onSave={handleSave} onCancel={() => setEditing(false)} />
          ) : (
            <DocumentViewContent doc={doc} />
          )}
        </div>
      </div>
    </div>
  )
}
