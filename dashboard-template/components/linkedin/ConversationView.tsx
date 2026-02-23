"use client" // Requires useState for panel state, useRef/useEffect for message scroll

import { useState, useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { parseJson } from "./panels/PanelHelpers"
import ConversationHeader from "./ConversationHeader"
import MessageBubble from "./MessageBubble"
import ContactIntelPanel from "./ContactIntelPanel"
import WampBreakdownPanel from "./panels/WampBreakdownPanel"
import DraftPanel from "./panels/DraftPanel"
import EnrichmentPanel from "./panels/EnrichmentPanel"
import DraftComposer from "./DraftComposer"

import type { LinkedInThread, LinkedInMessage, ThreadStatus, ThreadCategory, RightPanelView, WampV2Score } from "@/types"

interface ConversationViewProps {
  thread: LinkedInThread
  messages: LinkedInMessage[]
  loading: boolean
  onClose: () => void
  onSend: (content: string) => Promise<boolean>
  onUpdateStatus: (status: ThreadStatus) => void
  onUpdateThread: (threadId: string, updates: Record<string, unknown>) => void
  onScoreThread?: (threadId: string) => Promise<unknown>
  onEnrichThread?: (threadId: string) => Promise<unknown>
  onGenerateDraft?: (threadId: string, instruction?: string) => Promise<string[]>
  onChangeClassification?: (threadId: string, category: ThreadCategory, note: string) => void
  onClassifyThread?: (threadIds: string[]) => Promise<unknown>
}

export default function ConversationView({
  thread, messages, loading, onClose, onSend, onUpdateThread,
  onScoreThread, onEnrichThread, onGenerateDraft, onChangeClassification, onClassifyThread,
}: ConversationViewProps) {
  const [showPanel, setShowPanel] = useState(true)
  const [activePanel, setActivePanel] = useState<RightPanelView>("contact")
  const [draftText, setDraftText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const wampData = parseJson<WampV2Score>(thread.qualificationData)

  const handleScore = async () => {
    await onScoreThread?.(thread.id)
    setActivePanel("wamp")
  }

  const handleEnrich = async () => {
    await onEnrichThread?.(thread.id)
    setActivePanel("enrichment")
  }

  const handleClassify = async () => {
    await onClassifyThread?.([thread.id])
  }

  const handleArchive = () => {
    onUpdateThread(thread.id, { isArchived: true, status: "archived" })
  }

  const handleSnooze = (until: string) => {
    onUpdateThread(thread.id, { status: "snoozed", isSnoozed: true, snoozeUntil: until })
  }

  const handleUseDraft = (text: string) => {
    setDraftText(text)
    setActivePanel("contact")
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-card border-l border-border shadow-xl z-50 flex">
      {/* Main conversation panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <ConversationHeader
          thread={thread} showPanel={showPanel} activePanel={activePanel}
          onTogglePanel={() => setShowPanel(!showPanel)}
          onClose={onClose}
          onScore={handleScore}
          onDraft={() => setActivePanel("draft")}
          onClassify={handleClassify}
          onEnrich={handleEnrich}
          onSnooze={handleSnooze}
          onArchive={handleArchive}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={bottomRef} />
        </div>

        <DraftComposer threadId={thread.id} onSend={onSend} externalDraft={draftText} onDraftConsumed={() => setDraftText("")} />
      </div>

      {/* Right panel — swappable */}
      {showPanel && (
        activePanel === "wamp" && wampData ? (
          <WampBreakdownPanel data={wampData} threadId={thread.id}
            scoredAt={thread.updatedAt} onBack={() => setActivePanel("contact")}
            onRescore={onScoreThread ? () => onScoreThread(thread.id) : undefined} />
        ) : activePanel === "draft" ? (
          <DraftPanel threadId={thread.id} onBack={() => setActivePanel("contact")}
            onGenerateDraft={onGenerateDraft} onUseDraft={handleUseDraft} />
        ) : activePanel === "enrichment" ? (
          <EnrichmentPanel enrichmentData={thread.enrichmentData} onBack={() => setActivePanel("contact")} />
        ) : (
          <ContactIntelPanel
            thread={thread} messageCount={messages.length}
            onChangeClassification={(cat, note) => onChangeClassification?.(thread.id, cat, note)}
            onSwitchToWamp={wampData ? () => setActivePanel("wamp") : undefined}
          />
        )
      )}
    </div>
  )
}
