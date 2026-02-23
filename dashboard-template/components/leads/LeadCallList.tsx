"use client" // Requires useState, useEffect, useCallback for call list fetching and call logging actions

import { useState, useEffect, useCallback } from "react"
import { Loader2, Phone } from "lucide-react"

import { getCallListApi, updateLeadApi } from "@/services/lead.service"
import { createLeadActivityApi } from "@/services/lead.service"
import LeadCallCard from "./LeadCallCard"

import type { Lead } from "@/types"

interface LeadCallListProps {
  onSelectLead: (lead: Lead) => void
}

export default function LeadCallList({ onSelectLead }: LeadCallListProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCallList = useCallback(async () => {
    try {
      const list = await getCallListApi(10)
      setLeads(list)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCallList() }, [fetchCallList])

  const handleLogCall = useCallback(async (lead: Lead) => {
    const outcome = prompt("Call outcome:")
    if (!outcome) return
    await createLeadActivityApi({ leadId: lead.id, activityType: "call", content: outcome })
    await updateLeadApi(lead.id, {
      status: "Contacted",
      lastContactedAt: new Date().toISOString(),
    })
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
  }, [])

  const handleSkip = useCallback((lead: Lead) => {
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
  }, [])

  const handleArchive = useCallback(async (lead: Lead) => {
    await updateLeadApi(lead.id, { status: "Archived" })
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Phone size={40} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No qualified leads with phone numbers</p>
        <p className="text-xs text-muted-foreground mt-1">Enrich leads to find phone numbers, then qualify them</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{leads.length} leads ready to call — sorted by score</p>
      <div className="grid gap-4 md:grid-cols-2">
        {leads.map((lead) => (
          <div key={lead.id} onClick={() => onSelectLead(lead)} className="cursor-pointer">
            <LeadCallCard
              lead={lead}
              onLogCall={() => handleLogCall(lead)}
              onSkip={() => handleSkip(lead)}
              onArchive={() => handleArchive(lead)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
