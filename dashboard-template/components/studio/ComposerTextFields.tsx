"use client" // Requires state for controlled text inputs

import PostDraftPopover from "./PostDraftPopover"
import type { PostFormat } from "@/types"

interface Props {
  format: PostFormat
  hook: string; caption: string; cta: string; body: string; scriptNotes: string
  topic: string; hashtags: string[]
  onChange: (field: string, value: string | string[]) => void
  onGenerate: (field: string, instruction?: string) => Promise<{ draft?: string; drafts?: string[] }>
  generating: string | null
}

const FIELD_VISIBILITY: Record<PostFormat, string[]> = {
  text: ["hook", "caption", "cta", "hashtags"],
  carousel: ["caption", "hashtags"],
  short_video: ["hook", "scriptNotes", "cta", "caption", "hashtags"],
  long_video: ["hook", "scriptNotes", "body", "caption", "hashtags"],
  blog: ["hook", "body", "caption", "hashtags"],
  quote_card: ["hook", "caption"],
}

const FIELD_LABELS: Record<string, string> = {
  hook: "Hook", caption: "Caption / Description", cta: "Call to Action",
  body: "Body / Article", scriptNotes: "Script Notes", topic: "Topic", hashtags: "Hashtags",
}

const FIELD_HINTS: Record<string, string> = {
  hook: "Opening line that stops the scroll",
  caption: "Main post text or video description",
  cta: "Tell them what to do next",
  body: "Full article, show notes, or detailed content",
  scriptNotes: "Bullet points for speaking — one per beat",
}

export default function ComposerTextFields({ format, hook, caption, cta, body, scriptNotes, topic, hashtags, onChange, onGenerate, generating }: Props) {
  const visible = FIELD_VISIBILITY[format]

  const renderField = (field: string, value: string, multiline = false) => {
    if (!visible.includes(field)) return null
    return (
      <div key={field}>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-foreground">{FIELD_LABELS[field]}</label>
          <PostDraftPopover
            field={field}
            generating={generating === field}
            onGenerate={(inst) => onGenerate(field, inst)}
            onAccept={(v) => onChange(field, v)}
          />
        </div>
        {FIELD_HINTS[field] && <p className="text-[10px] text-muted-foreground mb-1">{FIELD_HINTS[field]}</p>}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            rows={field === "body" ? 8 : 4}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm resize-y"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-foreground">Topic</label>
        <input value={topic} onChange={(e) => onChange("topic", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm mt-1" />
      </div>

      {renderField("hook", hook)}
      {renderField("caption", caption, true)}
      {renderField("scriptNotes", scriptNotes, true)}
      {renderField("body", body, true)}
      {renderField("cta", cta)}

      {visible.includes("hashtags") && (
        <div>
          <label className="text-xs font-medium text-foreground">Hashtags</label>
          <input
            value={hashtags.join(", ")}
            onChange={(e) => onChange("hashtags", e.target.value.split(",").map((h) => h.trim()).filter(Boolean))}
            placeholder="#AI, #automation, #business"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm mt-1"
          />
        </div>
      )}
    </div>
  )
}
