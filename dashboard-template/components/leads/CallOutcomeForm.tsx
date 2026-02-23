"use client" // Requires useState for outcome and notes fields

import { useState } from "react"
import { Loader2, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CALL_OUTCOMES } from "@/lib/lead-constants"

import type { CallOutcome } from "@/types"

interface CallOutcomeFormProps {
  onSubmit: (outcome: CallOutcome, notes: string) => void
  loading?: boolean
}

export default function CallOutcomeForm({ onSubmit, loading }: CallOutcomeFormProps) {
  const [outcome, setOutcome] = useState<CallOutcome>("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    if (!outcome) return
    onSubmit(outcome, notes)
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
      <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-3">
        Log Call Outcome
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value as CallOutcome)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Call outcome">
            <option value="">Select outcome...</option>
            {CALL_OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={3} placeholder="Key points from the call..."
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Call notes" />
        </div>
        <Button onClick={handleSubmit} disabled={!outcome || loading}
          className="w-full bg-amber-600 hover:bg-amber-700"
          aria-label="Log outcome and generate follow-ups">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />}
          Log Outcome & Generate Follow-ups
        </Button>
      </div>
    </div>
  )
}
