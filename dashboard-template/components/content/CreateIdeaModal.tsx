"use client" // Requires useState for form fields, vetting state, and controlled inputs

import { useState } from "react"

import { X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

import { RejectionPanel, FormFields } from "./IdeaFormFields"

import type { IdeaCategory, IdeaSourceType, ContentFormat } from "@/types/index"
import type { CreateContentResult } from "@/services/content.service"

interface CreateIdeaModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    title: string
    contentType: string
    stage: string
    topic: string
    researchNotes: string
    priority: string
    ideaCategories: IdeaCategory[]
    sourceUrl: string
    sourceType: IdeaSourceType | undefined
    contentFormats: ContentFormat[]
  }) => Promise<CreateContentResult>
}

export default function CreateIdeaModal({ open, onClose, onSubmit }: CreateIdeaModalProps) {
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [researchNotes, setResearchNotes] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [categories, setCategories] = useState<Set<IdeaCategory>>(new Set())
  const [formats, setFormats] = useState<Set<ContentFormat>>(new Set())
  const [sourceUrl, setSourceUrl] = useState("")
  const [sourceType, setSourceType] = useState<IdeaSourceType | "">("")
  const [submitting, setSubmitting] = useState(false)
  const [rejection, setRejection] = useState<{ score: number; reasoning: string; evidence: string } | null>(null)

  if (!open) return null

  const isContentIdea = categories.has("Content Idea")

  const toggleCat = (cat: IdeaCategory) => {
    setCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const toggleFormat = (f: ContentFormat) => {
    setFormats((prev) => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  const resetForm = () => {
    setTitle(""); setTopic(""); setResearchNotes(""); setPriority("Medium")
    setCategories(new Set()); setFormats(new Set()); setSourceUrl(""); setSourceType("")
    setRejection(null)
  }

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setRejection(null)
    try {
      const result = await onSubmit({
        title: title.trim(),
        contentType: "Idea",
        stage: "Idea",
        topic: topic.trim(),
        researchNotes: researchNotes.trim(),
        priority,
        ideaCategories: Array.from(categories),
        sourceUrl: sourceUrl.trim(),
        sourceType: sourceType || undefined,
        contentFormats: isContentIdea ? Array.from(formats) : [],
      })
      if (result.vetted === false) {
        setRejection({ score: result.vetScore!, reasoning: result.vetReasoning!, evidence: result.vetEvidence! })
      } else {
        resetForm()
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Create new idea">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" aria-hidden="true" />
            New Idea
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {rejection && <RejectionPanel rejection={rejection} onDismiss={() => setRejection(null)} />}

          <FormFields
            title={title} setTitle={setTitle} topic={topic} setTopic={setTopic}
            researchNotes={researchNotes} setResearchNotes={setResearchNotes}
            priority={priority} setPriority={setPriority} categories={categories} toggleCat={toggleCat}
            isContentIdea={isContentIdea} formats={formats} toggleFormat={toggleFormat}
            sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} sourceType={sourceType} setSourceType={setSourceType}
          />

          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? "Vetting idea..." : "Create Idea"}
          </Button>
        </div>
      </div>
    </div>
  )
}
