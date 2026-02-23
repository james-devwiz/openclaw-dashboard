"use client" // Requires useState for slide editing state

import { Plus, Trash2, GripVertical } from "lucide-react"
import PostDraftPopover from "./PostDraftPopover"
import type { CarouselSlide } from "@/types"

interface Props {
  slides: CarouselSlide[]
  onChange: (slides: CarouselSlide[]) => void
  onGenerate: (field: string, instruction?: string) => Promise<{ draft?: string; drafts?: string[]; slides?: CarouselSlide[] }>
  generating: string | null
}

export default function ComposerSlides({ slides, onChange, onGenerate, generating }: Props) {
  const addSlide = () => {
    onChange([...slides, { slideNumber: slides.length + 1, text: "", designNotes: "" }])
  }

  const removeSlide = (index: number) => {
    const updated = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, slideNumber: i + 1 }))
    onChange(updated)
  }

  const updateSlide = (index: number, field: "text" | "designNotes", value: string) => {
    const updated = slides.map((s, i) => i === index ? { ...s, [field]: value } : s)
    onChange(updated)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-foreground">Carousel Slides ({slides.length})</label>
        <PostDraftPopover
          field="slides"
          generating={generating === "slides"}
          onGenerate={(inst) => onGenerate("slides", inst)}
          onAccept={(v) => {
            try {
              const parsed = JSON.parse(v) as CarouselSlide[]
              if (Array.isArray(parsed)) onChange(parsed)
            } catch { /* ignore parse errors */ }
          }}
        />
      </div>

      <div className="space-y-3">
        {slides.map((slide, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical size={14} className="text-muted-foreground cursor-grab" />
              <span className="text-xs font-semibold text-muted-foreground">
                Slide {slide.slideNumber}{i === 0 ? " (Hook)" : i === slides.length - 1 ? " (CTA)" : ""}
              </span>
              <button onClick={() => removeSlide(i)} className="ml-auto text-muted-foreground hover:text-red-500" aria-label="Remove slide">
                <Trash2 size={12} />
              </button>
            </div>
            <textarea
              value={slide.text}
              onChange={(e) => updateSlide(i, "text", e.target.value)}
              placeholder="Slide text..."
              rows={2}
              className="w-full rounded-md border border-border bg-muted/30 px-2 py-1.5 text-sm mb-2 resize-y"
            />
            <input
              value={slide.designNotes}
              onChange={(e) => updateSlide(i, "designNotes", e.target.value)}
              placeholder="Design notes (layout, imagery, emphasis)..."
              className="w-full rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs"
            />
          </div>
        ))}
      </div>

      <button
        onClick={addSlide}
        className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
        aria-label="Add slide"
      >
        <Plus size={14} /> Add Slide
      </button>
    </div>
  )
}
