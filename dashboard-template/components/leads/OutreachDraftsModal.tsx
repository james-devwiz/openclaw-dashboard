"use client" // Requires useState for editable draft fields and interactive buttons

import { useState } from "react"
import { X, Loader2, Send, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DraftSection {
  subject: string
  body: string
}

interface LinkedInDraft {
  connectionNote: string
  firstMessage: string
}

interface Drafts {
  email: DraftSection
  bump: DraftSection
  value: DraftSection
  breakup: DraftSection
  linkedin: LinkedInDraft
}

interface OutreachDraftsModalProps {
  draftsJson: string
  onClose: () => void
  onSave: (draftsJson: string) => void
  onExecute: () => void
  executing?: boolean
}

function parseDrafts(json: string): Drafts {
  try {
    const d = JSON.parse(json)
    return {
      email: { subject: d.email?.subject || "", body: d.email?.body || "" },
      bump: { subject: d.bump?.subject || "", body: d.bump?.body || "" },
      value: { subject: d.value?.subject || "", body: d.value?.body || "" },
      breakup: { subject: d.breakup?.subject || "", body: d.breakup?.body || "" },
      linkedin: { connectionNote: d.linkedin?.connectionNote || "", firstMessage: d.linkedin?.firstMessage || "" },
    }
  } catch {
    return {
      email: { subject: "", body: "" }, bump: { subject: "", body: "" },
      value: { subject: "", body: "" }, breakup: { subject: "", body: "" },
      linkedin: { connectionNote: "", firstMessage: "" },
    }
  }
}

export default function OutreachDraftsModal({
  draftsJson, onClose, onSave, onExecute, executing,
}: OutreachDraftsModalProps) {
  const [drafts, setDrafts] = useState<Drafts>(() => parseDrafts(draftsJson))

  const updateSection = (key: keyof Omit<Drafts, "linkedin">, field: "subject" | "body", val: string) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: val } }))
  }

  const updateLinkedIn = (field: keyof LinkedInDraft, val: string) => {
    setDrafts((prev) => ({ ...prev, linkedin: { ...prev.linkedin, [field]: val } }))
  }

  const handleSave = () => onSave(JSON.stringify(drafts))

  const handleExecute = () => {
    onSave(JSON.stringify(drafts))
    onExecute()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-card rounded-xl shadow-2xl border border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Outreach Drafts</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-5 flex-1">
          <DraftSectionEditor title="LinkedIn" section={null}
            linkedin={drafts.linkedin} onLinkedInChange={updateLinkedIn} />
          <DraftSectionEditor title="Initial Email" section={drafts.email}
            onChange={(f, v) => updateSection("email", f, v)} />
          <DraftSectionEditor title="Bump Email" section={drafts.bump}
            onChange={(f, v) => updateSection("bump", f, v)} />
          <DraftSectionEditor title="Value Email" section={drafts.value}
            onChange={(f, v) => updateSection("value", f, v)} />
          <DraftSectionEditor title="Breakup Email" section={drafts.breakup}
            onChange={(f, v) => updateSection("breakup", f, v)} />
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button onClick={handleSave} variant="outline"
            aria-label="Save draft changes">
            <Save size={14} /> Save Changes
          </Button>
          <Button onClick={handleExecute} disabled={executing}
            aria-label="Execute outreach">
            {executing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Execute Outreach
          </Button>
        </div>
      </div>
    </div>
  )
}

function DraftSectionEditor({ title, section, onChange, linkedin, onLinkedInChange }: {
  title: string
  section: DraftSection | null
  onChange?: (field: "subject" | "body", val: string) => void
  linkedin?: LinkedInDraft
  onLinkedInChange?: (field: keyof LinkedInDraft, val: string) => void
}) {
  const inputClass = "w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      {linkedin && onLinkedInChange ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Connection Note</label>
            <textarea value={linkedin.connectionNote} rows={2} className={inputClass}
              onChange={(e) => onLinkedInChange("connectionNote", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">First Message</label>
            <textarea value={linkedin.firstMessage} rows={2} className={inputClass}
              onChange={(e) => onLinkedInChange("firstMessage", e.target.value)} />
          </div>
        </div>
      ) : section && onChange ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Subject</label>
            <input value={section.subject} className={inputClass}
              onChange={(e) => onChange("subject", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Body</label>
            <textarea value={section.body} rows={3} className={inputClass}
              onChange={(e) => onChange("body", e.target.value)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
