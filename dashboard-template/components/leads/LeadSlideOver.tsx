"use client" // Requires useEffect/useState for keyboard handler, modal state; interactive buttons for pipeline actions

import { useEffect, useState } from "react"

import LeadSlideOverFields from "./LeadSlideOverFields"
import LeadEnrichmentCard from "./LeadEnrichmentCard"
import LeadOutreachPreview from "./LeadOutreachPreview"
import LeadActivitySection from "./LeadActivitySection"
import LeadCommentSection from "./LeadCommentSection"
import CallOutcomeForm from "./CallOutcomeForm"
import OutreachDraftsModal from "./OutreachDraftsModal"
import FollowUpDraftsModal from "./FollowUpDraftsModal"
import { SlideOverHeader, ResearchSummary, FollowUpPreview } from "./LeadSlideOverParts"

import type { Lead, CallOutcome } from "@/types"

interface LeadSlideOverProps {
  lead: Lead
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Lead>) => void
  onDelete: (id: string) => void
  onEnrich?: (id: string) => void
  enriching?: boolean
  onGenerateOutreach?: (id: string) => void
  generatingOutreach?: boolean
  onGenerateResearch?: (id: string) => void
  generatingResearch?: boolean
  onExecuteOutreach?: (id: string) => void
  executingOutreach?: boolean
  onLogCallOutcome?: (id: string, outcome: CallOutcome, notes: string) => void
  loggingCall?: boolean
  onExecuteFollowUp?: (id: string) => void
  executingFollowUp?: boolean
  onMarkConnected?: (id: string) => void
}

export default function LeadSlideOver({
  lead, onClose, onUpdate, onDelete, onEnrich, enriching,
  onGenerateOutreach, generatingOutreach, onGenerateResearch, generatingResearch,
  onExecuteOutreach, executingOutreach, onLogCallOutcome, loggingCall,
  onExecuteFollowUp, executingFollowUp, onMarkConnected,
}: LeadSlideOverProps) {
  const [showDraftsModal, setShowDraftsModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const canGenerate = lead.status === "Qualified" && !lead.outreachDrafts
  const canRegenerate = !!lead.outreachDrafts
  const hasDrafts = !!lead.outreachDrafts

  const handleDelete = () => {
    if (window.confirm(`Delete "${lead.companyName}"? This cannot be undone.`)) {
      onDelete(lead.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Lead details">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <SlideOverHeader
          lead={lead} onClose={onClose} handleDelete={handleDelete}
          onEnrich={onEnrich} enriching={enriching}
          canGenerate={canGenerate} canRegenerate={canRegenerate}
          onGenerateOutreach={onGenerateOutreach} generatingOutreach={generatingOutreach}
          hasDrafts={hasDrafts} onOpenDrafts={() => setShowDraftsModal(true)}
          onMarkConnected={onMarkConnected}
          onOpenFollowUp={() => setShowFollowUpModal(true)}
          executingFollowUp={executingFollowUp}
        />

        <div className="p-6 space-y-6">
          <ResearchSummary
            summary={lead.researchSummary}
            onGenerate={onGenerateResearch ? () => onGenerateResearch(lead.id) : undefined}
            generating={generatingResearch}
          />

          <LeadSlideOverFields lead={lead} onUpdate={(updates) => onUpdate(lead.id, updates)} />

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Enrichment</h3>
            <LeadEnrichmentCard lead={lead} />
          </div>

          {lead.status === "Call" && onLogCallOutcome && (
            <CallOutcomeForm
              onSubmit={(outcome, notes) => onLogCallOutcome(lead.id, outcome, notes)}
              loading={loggingCall}
            />
          )}

          {lead.followUpDrafts && lead.status !== "Follow Up" && (
            <FollowUpPreview draftsJson={lead.followUpDrafts} onEdit={() => setShowFollowUpModal(true)} />
          )}

          {lead.outreachDrafts && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Outreach Drafts</h3>
              <LeadOutreachPreview draftsJson={lead.outreachDrafts} />
            </div>
          )}

          <LeadActivitySection leadId={lead.id} />
          <LeadCommentSection leadId={lead.id} />
        </div>
      </div>

      {showDraftsModal && hasDrafts && (
        <OutreachDraftsModal
          draftsJson={lead.outreachDrafts}
          onClose={() => setShowDraftsModal(false)}
          onSave={(json) => onUpdate(lead.id, { outreachDrafts: json })}
          onExecute={() => { setShowDraftsModal(false); onExecuteOutreach?.(lead.id) }}
          executing={executingOutreach}
        />
      )}

      {showFollowUpModal && lead.followUpDrafts && (
        <FollowUpDraftsModal
          draftsJson={lead.followUpDrafts}
          onClose={() => setShowFollowUpModal(false)}
          onSave={(json) => onUpdate(lead.id, { followUpDrafts: json })}
          onExecute={() => { setShowFollowUpModal(false); onExecuteFollowUp?.(lead.id) }}
          executing={executingFollowUp}
        />
      )}
    </div>
  )
}
