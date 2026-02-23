"use client" // Requires useState for loading states on action buttons

import { useState } from "react"
import { X, ExternalLink, Target, Sparkles, Tag, Search, Clock, Archive, PanelRightOpen, PanelRightClose, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import SnoozeMenu from "./SnoozeMenu"
import type { LinkedInThread, RightPanelView } from "@/types"

interface ConversationHeaderProps {
  thread: LinkedInThread
  showPanel: boolean
  onTogglePanel: () => void
  onClose: () => void
  onScore: () => Promise<void>
  onDraft: () => void
  onClassify: () => Promise<void>
  onEnrich: () => Promise<void>
  onSnooze: (until: string) => void
  onArchive: () => void
  activePanel: RightPanelView
}

interface ActionButton {
  key: string; icon: React.ReactNode; label: string; tooltip: string
  onClick: () => void; loading?: boolean; active?: boolean
}

export default function ConversationHeader({
  thread, showPanel, onTogglePanel, onClose,
  onScore, onDraft, onClassify, onEnrich, onSnooze, onArchive, activePanel,
}: ConversationHeaderProps) {
  const [scoring, setScoring] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [enriching, setEnriching] = useState(false)

  const handleScore = async () => { setScoring(true); try { await onScore() } finally { setScoring(false) } }
  const handleClassify = async () => { setClassifying(true); try { await onClassify() } finally { setClassifying(false) } }
  const handleEnrich = async () => { setEnriching(true); try { await onEnrich() } finally { setEnriching(false) } }

  const actions: ActionButton[] = [
    { key: "score", icon: scoring ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />, label: "Score", tooltip: "Calculate WAMP score", onClick: handleScore, loading: scoring, active: activePanel === "wamp" },
    { key: "draft", icon: <Sparkles size={14} />, label: "Draft", tooltip: "Generate AI draft reply", onClick: onDraft, active: activePanel === "draft" },
    { key: "classify", icon: classifying ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />, label: "Classify", tooltip: "Re-classify based on latest messages", onClick: handleClassify, loading: classifying },
    { key: "enrich", icon: enriching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />, label: "Enrich", tooltip: "Enrich via Apollo", onClick: handleEnrich, loading: enriching, active: activePanel === "enrichment" },
  ]

  return (
    <div className="border-b border-border">
      {/* Top row: avatar + name + close */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 size-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {thread.participantAvatarUrl ? (
              <img src={thread.participantAvatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full grid place-content-center text-sm font-medium text-muted-foreground">
                {thread.participantName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">{thread.participantName}</span>
              {thread.participantProfileUrl && (
                <a href={thread.participantProfileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground" aria-label="View LinkedIn profile">
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
            </div>
            {thread.participantHeadline && (
              <p className="text-xs text-muted-foreground truncate">{thread.participantHeadline}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onTogglePanel} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            aria-label="Toggle panel">
            {showPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            aria-label="Close conversation">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
        {actions.map((a) => (
          <button key={a.key} onClick={a.onClick} disabled={a.loading} title={a.tooltip}
            className={cn(
              "flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors disabled:opacity-50",
              a.active ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}>
            {a.icon} {a.label}
          </button>
        ))}
        <SnoozeMenu onSnooze={onSnooze} />
        <button onClick={onArchive} title="Archive thread"
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium text-muted-foreground hover:bg-accent hover:text-foreground whitespace-nowrap">
          <Archive size={14} /> Archive
        </button>
      </div>
    </div>
  )
}
