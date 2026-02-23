"use client" // Requires useState for editable follow-up draft fields

import { useState } from "react"
import { X, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FollowUpDrafts {
  email: { subject: string; body: string }
  linkedin?: { message: string }
}

interface FollowUpDraftsModalProps {
  draftsJson: string
  onClose: () => void
  onSave: (draftsJson: string) => void
  onExecute: () => void
  executing?: boolean
}

function parseDrafts(json: string): FollowUpDrafts {
  try {
    const d = JSON.parse(json)
    return {
      email: { subject: d.email?.subject || "", body: d.email?.body || "" },
      linkedin: d.linkedin ? { message: d.linkedin.message || "" } : undefined,
    }
  } catch {
    return { email: { subject: "", body: "" } }
  }
}

export default function FollowUpDraftsModal({
  draftsJson, onClose, onSave, onExecute, executing,
}: FollowUpDraftsModalProps) {
  const [drafts, setDrafts] = useState<FollowUpDrafts>(() => parseDrafts(draftsJson))

  const inputClass = "w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-purple-500"

  const handleExecute = () => {
    onSave(JSON.stringify(drafts))
    onExecute()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-2xl border border-border flex flex-col max-h-[75vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Follow-up Drafts</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Follow-up Email</h3>
            <div className="space-y-2">
              <input value={drafts.email.subject} className={inputClass} placeholder="Subject"
                onChange={(e) => setDrafts((p) => ({ ...p, email: { ...p.email, subject: e.target.value } }))} />
              <textarea value={drafts.email.body} rows={4} className={inputClass} placeholder="Email body"
                onChange={(e) => setDrafts((p) => ({ ...p, email: { ...p.email, body: e.target.value } }))} />
            </div>
          </div>

          {drafts.linkedin && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">LinkedIn Message</h3>
              <textarea value={drafts.linkedin.message} rows={3} className={inputClass} placeholder="LinkedIn message"
                onChange={(e) => setDrafts((p) => ({ ...p, linkedin: { message: e.target.value } }))} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button onClick={handleExecute} disabled={executing}
            className="bg-purple-600 hover:bg-purple-700"
            aria-label="Send follow-ups">
            {executing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send Follow-ups
          </Button>
        </div>
      </div>
    </div>
  )
}
