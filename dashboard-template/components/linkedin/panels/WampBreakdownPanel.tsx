"use client" // Requires useState for history state, useEffect for fetch, interactive buttons

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getWampBand, formatRelativeTime } from "@/lib/linkedin-constants"
import { getScoreHistoryApi } from "@/services/linkedin.service"
import WampScoreBadge from "../WampScoreBadge"
import ScoreHistoryTimeline from "./ScoreHistoryTimeline"

import type { WampV2Score, ScoreHistoryEntry } from "@/types"

interface WampBreakdownPanelProps {
  data: WampV2Score
  threadId: string
  scoredAt?: string
  onBack: () => void
  onRescore?: () => Promise<unknown>
}

const BUSINESS_LABELS: Record<string, string> = {
  "business-a": "Business A",
  "business-b": "Business B",
  "business-c": "Business C",
}

export default function WampBreakdownPanel({ data, threadId, scoredAt, onBack, onRescore }: WampBreakdownPanelProps) {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([])
  const [rescoring, setRescoring] = useState(false)

  const fetchHistory = useCallback(async () => {
    try {
      const entries = await getScoreHistoryApi(threadId)
      setHistory(entries)
    } catch { /* non-critical */ }
  }, [threadId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleRescore = async () => {
    if (!onRescore || rescoring) return
    setRescoring(true)
    try {
      await onRescore()
      fetchHistory()
    } finally {
      setRescoring(false)
    }
  }

  return (
    <div className="w-72 border-l border-border overflow-y-auto p-4 space-y-4 shrink-0">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft size={12} /> Back
      </Button>

      <div className="text-center">
        <WampScoreBadge score={data.total} size="md" business={data.suggestedBusiness} />
        {scoredAt && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Scored {formatRelativeTime(scoredAt)}
          </p>
        )}
      </div>

      {onRescore && (
        <Button onClick={handleRescore} disabled={rescoring} variant="outline" size="sm"
          className="w-full" aria-label="Rescore thread">
          {rescoring ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {rescoring ? "Rescoring..." : "Rescore"}
        </Button>
      )}

      <LayerSection title="Profile Fit" subtotal={data.layer1.subtotal} max={30}
        factors={[
          { label: "Business Stage", value: data.layer1.businessStage },
          { label: "Buyer vs Competitor", value: data.layer1.buyerVsCompetitor },
          { label: "Pain & Opportunity", value: data.layer1.painOpportunity },
        ]} />

      <LayerSection title="Post & Content" subtotal={data.layer2.subtotal} max={30}
        factors={[
          { label: "Topic Relevance", value: data.layer2.topicRelevance },
          { label: "Buying Signals", value: data.layer2.opennessBuyingSignals },
          { label: "Engagement Quality", value: data.layer2.engagementQuality },
        ]} />

      <LayerSection title="DM Conversation" subtotal={data.layer3.subtotal} max={40}
        factors={[
          { label: "Curiosity", value: data.layer3.curiosityQuestioning },
          { label: "Need/Pain", value: data.layer3.needPainDisclosure },
          { label: "Reciprocity", value: data.layer3.reciprocityInvestment },
          { label: "Readiness", value: data.layer3.readinessToAct },
        ]} />

      {!data.dmConversationExists && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">No DM — capped at 60</p>
      )}

      {data.suggestedBusiness && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Business Routing</p>
          <p className="text-xs text-foreground font-medium">{BUSINESS_LABELS[data.suggestedBusiness] || data.suggestedBusiness}</p>
        </div>
      )}

      {data.messagingGuidance && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Next Step</p>
          <p className="text-xs text-foreground">{data.messagingGuidance}</p>
        </div>
      )}

      {data.summary && (
        <p className="text-xs text-muted-foreground">{data.summary}</p>
      )}

      <ScoreHistoryTimeline history={history} />
    </div>
  )
}

function LayerSection({ title, subtotal, max, factors }: {
  title: string; subtotal: number; max: number
  factors: Array<{ label: string; value: number }>
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
        <span className="text-[10px] font-medium text-foreground">{subtotal}/{max}</span>
      </div>
      <div className="space-y-1">
        {factors.map((f) => (
          <FactorBar key={f.label} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  )
}

function FactorBar({ label, value }: { label: string; value: number }) {
  const band = getWampBand(value * 10)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", band.color.split(" ")[0])} style={{ width: `${value * 10}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-4 text-right">{value}</span>
    </div>
  )
}
