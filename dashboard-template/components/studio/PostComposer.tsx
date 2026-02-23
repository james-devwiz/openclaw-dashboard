"use client" // Requires useState for form state, modal interactions

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

import FormatPicker from "./FormatPicker"
import ComposerTextFields from "./ComposerTextFields"
import ComposerSlides from "./ComposerSlides"
import ComposerPlatforms from "./ComposerPlatforms"

import type { PostFormat, CarouselSlide } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    title: string; format: PostFormat; caption?: string; hook?: string; cta?: string
    body?: string; scriptNotes?: string; slides?: CarouselSlide[]
    topic?: string; hashtags?: string[]; priority?: string
  }) => Promise<unknown>
}

export default function PostComposer({ open, onClose, onSubmit }: Props) {
  const [format, setFormat] = useState<PostFormat>("text")
  const [title, setTitle] = useState("")
  const [hook, setHook] = useState("")
  const [caption, setCaption] = useState("")
  const [cta, setCta] = useState("")
  const [body, setBody] = useState("")
  const [scriptNotes, setScriptNotes] = useState("")
  const [topic, setTopic] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [priority, setPriority] = useState("Medium")
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleChange = (field: string, value: string | string[]) => {
    const setters: Record<string, (v: string) => void> = {
      hook: setHook, caption: setCaption, cta: setCta,
      body: setBody, scriptNotes: setScriptNotes, topic: setTopic,
    }
    if (field === "hashtags") setHashtags(value as string[])
    else if (setters[field]) setters[field](value as string)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ title, format, caption, hook, cta, body, scriptNotes, slides, topic, hashtags, priority })
      resetForm()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle(""); setFormat("text"); setHook(""); setCaption(""); setCta("")
    setBody(""); setScriptNotes(""); setTopic(""); setHashtags([]); setSlides([])
  }

  const dummyGenerate = async () => ({ draft: "", drafts: [] })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-8 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-xl p-6 mb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">New Post</h2>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-foreground">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title..." className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm mt-1" />
          </div>

          <FormatPicker selected={format} onSelect={setFormat} />

          <ComposerTextFields
            format={format} hook={hook} caption={caption} cta={cta} body={body}
            scriptNotes={scriptNotes} topic={topic} hashtags={hashtags}
            onChange={handleChange} onGenerate={dummyGenerate} generating={null}
          />

          {format === "carousel" && (
            <ComposerSlides slides={slides} onChange={setSlides} onGenerate={dummyGenerate} generating={null} />
          )}

          <div>
            <label className="text-xs font-medium text-foreground">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm mt-1">
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button onClick={onClose} variant="ghost">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
            {submitting ? "Creating..." : "Create Post"}
          </Button>
        </div>
      </div>
    </div>
  )
}
