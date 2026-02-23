import { Users, Phone, Flame, TrendingUp, Target } from "lucide-react"

import type { LeadStats } from "@/types"

interface LeadStatCardsProps {
  stats: LeadStats | null
}

export default function LeadStatCards({ stats }: LeadStatCardsProps) {
  if (!stats) return null

  const cards = [
    { label: "Total Leads", value: stats.total, icon: Users, color: "text-blue-600" },
    { label: "Qualified", value: stats.qualified, icon: Target, color: "text-green-600" },
    { label: "Contacted This Week", value: stats.contactedThisWeek, icon: Phone, color: "text-purple-600" },
    { label: "Hot Leads", value: stats.hotLeads, icon: Flame, color: "text-red-600" },
    { label: "Avg Score", value: stats.avgScore, icon: TrendingUp, color: "text-amber-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <card.icon size={14} className={card.color} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
