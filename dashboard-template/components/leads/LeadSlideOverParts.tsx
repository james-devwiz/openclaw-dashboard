"use client" // Required for interactive buttons and state-dependent rendering

import { Trash2, Sparkles, Loader2, Send, RefreshCw, FileText, Link2, Loader, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import type { Lead } from "@/types"

export function SlideOverHeader({ lead, onClose, handleDelete, onEnrich, enriching,
  canGenerate, canRegenerate, onGenerateOutreach, generatingOutreach,
  hasDrafts, onOpenDrafts, onMarkConnected, onOpenFollowUp, executingFollowUp,
}: {
  lead: Lead; onClose: () => void; handleDelete: () => void
  onEnrich?: (id: string) => void; enriching?: boolean
  canGenerate: boolean; canRegenerate: boolean
  onGenerateOutreach?: (id: string) => void; generatingOutreach?: boolean
  hasDrafts: boolean; onOpenDrafts: () => void
  onMarkConnected?: (id: string) => void
  onOpenFollowUp: () => void; executingFollowUp?: boolean
}) {
  return (
    <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {lead.logoUrl ? (
            <img src={lead.logoUrl} alt="" className="w-8 h-8 rounded-md object-contain bg-accent shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
              {lead.companyName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h2 className="text-lg font-semibold text-foreground truncate">{lead.companyName}</h2>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="default" className="text-[10px]">{lead.status}</Badge>
          <Badge variant="secondary" className="text-[10px]">{lead.business}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {onEnrich && (
          <button onClick={() => onEnrich(lead.id)} disabled={enriching} title="Enrich lead data"
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
            aria-label="Enrich lead data via Apollo">
            {enriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
        )}
        {(canGenerate || canRegenerate) && onGenerateOutreach && !hasDrafts && (
          <button onClick={() => onGenerateOutreach(lead.id)} disabled={generatingOutreach} title="Generate outreach"
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
            aria-label="Generate AI outreach drafts">
            {generatingOutreach ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        )}
        {hasDrafts && (
          <button onClick={onOpenDrafts} title="View/Edit Drafts"
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
            aria-label="View and edit outreach drafts">
            <FileText size={16} />
          </button>
        )}
        {lead.status === "LinkedIn Request" && onMarkConnected && (
          <button onClick={() => onMarkConnected(lead.id)} title="Mark LinkedIn Connected"
            className="p-2 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors"
            aria-label="Mark LinkedIn connected">
            <Link2 size={16} />
          </button>
        )}
        {lead.status === "Follow-up Ready" && (
          <button onClick={onOpenFollowUp} disabled={executingFollowUp} title="Send Follow-ups"
            className="p-2 rounded-lg text-purple-600 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
            aria-label="Send follow-ups">
            {executingFollowUp ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        )}
        <button onClick={handleDelete} title="Delete lead"
          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
          aria-label="Delete lead">
          <Trash2 size={16} />
        </button>
        <button onClick={onClose} title="Close"
          className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close lead details">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export function ResearchSummary({ summary, onGenerate, generating }: {
  summary: string; onGenerate?: () => void; generating?: boolean
}) {
  if (!summary && !onGenerate) return null
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Research Summary</h3>
      {summary ? (
        <div className="flex items-start gap-2">
          <p className="text-sm text-foreground flex-1">{summary}</p>
          {onGenerate && (
            <button onClick={onGenerate} disabled={generating} title="Regenerate"
              className="p-1 rounded text-muted-foreground hover:text-blue-600 transition-colors shrink-0 disabled:opacity-50"
              aria-label="Regenerate research summary">
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            </button>
          )}
        </div>
      ) : (
        <button onClick={onGenerate} disabled={generating}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          aria-label="Generate research summary">
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate Summary
        </button>
      )}
    </div>
  )
}

export function FollowUpPreview({ draftsJson, onEdit }: { draftsJson: string; onEdit: () => void }) {
  let drafts: { email?: { subject?: string }; linkedin?: { message?: string } } = {}
  try { drafts = JSON.parse(draftsJson) } catch { return null }
  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Follow-up Drafts</h3>
        <button onClick={onEdit} className="text-xs text-purple-600 hover:text-purple-700" aria-label="Edit follow-up drafts">
          Edit & Send
        </button>
      </div>
      {drafts.email?.subject && <p className="text-xs text-muted-foreground truncate">Email: {drafts.email.subject}</p>}
      {drafts.linkedin?.message && <p className="text-xs text-muted-foreground truncate">LinkedIn: {drafts.linkedin.message.slice(0, 60)}...</p>}
    </div>
  )
}
