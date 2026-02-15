"use client" // Requires onClick handler for card selection

import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatRelativeTime, getStaleness } from "@/lib/utils"

import type { MemoryItem, MemoryCategory } from "@/types/index"

const BADGE_COLORS: Record<MemoryCategory, string> = {
  core: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  business: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  orchestration: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  memory: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  research: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  projects: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  uncategorised: "bg-muted text-muted-foreground",
}

const STALENESS_BORDER: Record<string, string> = {
  fresh: "border-l-green-500",
  aging: "border-l-amber-500",
  stale: "border-l-red-500",
}

interface MemoryCardProps {
  item: MemoryItem
  query?: string
  onClick: (item: MemoryItem) => void
}

export default function MemoryCard({ item, query, onClick }: MemoryCardProps) {
  const staleness = getStaleness(item.lastModified)
  const excerptText = query ? highlightExcerpt(item.excerpt, query) : item.excerpt

  return (
    <button
      onClick={() => onClick(item)}
      className={`w-full text-left p-4 rounded-xl border border-border border-l-4 ${STALENESS_BORDER[staleness.level]} bg-card shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-200`}
      aria-label={`Open ${item.title}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <FileText size={16} className="text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate capitalize">{item.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{excerptText}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={`text-[10px] capitalize border-0 ${BADGE_COLORS[item.category]}`}>
              {item.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(item.lastModified)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function highlightExcerpt(text: string, query: string): React.ReactNode {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">{part}</mark> : part
  )
}
