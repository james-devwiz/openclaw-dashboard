"use client" // Requires interactive classification editor via ClassificationSection

import { parseJson } from "./panels/PanelHelpers"
import ProfileSection from "./panels/ProfileSection"
import CompanySection from "./panels/CompanySection"
import ClassificationSection from "./panels/ClassificationSection"
import ThreadInfoSection from "./panels/ThreadInfoSection"
import WampScoreBadge from "./WampScoreBadge"
import type { LinkedInThread, ThreadCategory, WampV2Score } from "@/types"

interface ContactIntelPanelProps {
  thread: LinkedInThread
  messageCount: number
  onChangeClassification: (category: ThreadCategory, note: string) => void
  onSwitchToWamp?: () => void
}

interface EnrichmentData {
  person?: { email?: string; phone_numbers?: Array<{ raw_number: string }>; city?: string; state?: string; country?: string }
  organization?: { name?: string; website_url?: string; industry?: string; estimated_num_employees?: number; annual_revenue?: number | null }
}

export default function ContactIntelPanel({
  thread, messageCount, onChangeClassification, onSwitchToWamp,
}: ContactIntelPanelProps) {
  const enrichment = parseJson<EnrichmentData>(thread.enrichmentData)
  const wampData = parseJson<WampV2Score>(thread.qualificationData)

  return (
    <div className="w-72 border-l border-border overflow-y-auto p-4 space-y-5 shrink-0">
      <ProfileSection thread={thread} person={enrichment?.person} />

      {enrichment?.organization && <CompanySection org={enrichment.organization} />}

      {/* Compact WAMP summary — clickable to see full breakdown */}
      {thread.wampScore != null && (
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">WAMP Score</h3>
          <button onClick={onSwitchToWamp} className="hover:opacity-80 transition-opacity"
            aria-label="View WAMP breakdown">
            <WampScoreBadge score={thread.wampScore} size="md" business={wampData?.suggestedBusiness} />
          </button>
          {wampData?.summary && (
            <p className="text-xs text-muted-foreground mt-1.5">{wampData.summary}</p>
          )}
        </div>
      )}

      <ClassificationSection thread={thread} onChangeClassification={onChangeClassification} />

      <ThreadInfoSection
        messageCount={messageCount}
        createdAt={thread.createdAt}
        lastMessageAt={thread.lastMessageAt}
        classifiedAt={thread.classifiedAt}
      />
    </div>
  )
}
