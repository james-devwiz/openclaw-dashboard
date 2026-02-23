"use client" // Requires useState for form fields; controlled inputs

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { BUSINESSES } from "@/lib/lead-constants"

import type { LeadBusiness } from "@/types"

interface CreateLeadModalProps {
  onClose: () => void
  onSubmit: (input: {
    companyName: string; contactName?: string; phone?: string
    email?: string; website?: string; business?: LeadBusiness; notes?: string
  }) => void
}

export default function CreateLeadModal({ onClose, onSubmit }: CreateLeadModalProps) {
  const [companyName, setCompanyName] = useState("")
  const [contactName, setContactName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [business, setBusiness] = useState<LeadBusiness>("Business A")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || !contactName.trim()) return
    onSubmit({ companyName, contactName, phone, email, website, business, notes })
    onClose()
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  )

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">New Lead</h3>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-accent" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Company Name *">
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="Company name" required />
          </Field>
          <Field label="Contact Name *">
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} placeholder="Full name" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+1..." />
            </Field>
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="email@..." type="email" />
            </Field>
          </div>
          <Field label="Website">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
          </Field>
          <Field label="Business">
            <select value={business} onChange={(e) => setBusiness(e.target.value as LeadBusiness)}
              className={inputCls} aria-label="Business entity">
              {BUSINESSES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className={cn(inputCls, "resize-none")} rows={2} placeholder="Initial notes..." />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!companyName.trim() || !contactName.trim()}>
              Create Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
