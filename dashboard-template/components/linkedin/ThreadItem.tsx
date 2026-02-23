import { Star, Handshake } from "lucide-react"

import { cn } from "@/lib/utils"
import { STATUS_COLORS, STATUS_LABELS, CATEGORY_LABELS, CATEGORY_COLORS, getWampBand } from "@/lib/linkedin-constants"
import type { LinkedInThread } from "@/types"

interface ThreadItemProps {
  thread: LinkedInThread
  isActive: boolean
  onClick: () => void
}

export default function ThreadItem({ thread, isActive, onClick }: ThreadItemProps) {
  const timeAgo = thread.lastMessageAt ? formatRelative(thread.lastMessageAt) : ""
  const snoozeLabel = thread.isSnoozed && thread.snoozeUntil ? formatSnoozeUntil(thread.snoozeUntil) : ""

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-colors",
        isActive
          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
          : "bg-card border-border hover:bg-accent"
      )}
      aria-label={`Open conversation with ${thread.participantName}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="shrink-0 size-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {thread.participantAvatarUrl ? (
            <img src={thread.participantAvatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-content-center text-sm font-medium text-muted-foreground">
              {thread.participantName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground truncate">{thread.participantName}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
          </div>
          {thread.participantHeadline && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.participantHeadline}</p>
          )}
          <p className="text-xs text-muted-foreground truncate mt-1">{thread.lastMessage || "No messages"}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", STATUS_COLORS[thread.status])}>
              {STATUS_LABELS[thread.status]}
            </span>
            {thread.category && CATEGORY_LABELS[thread.category] && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", CATEGORY_COLORS[thread.category] || "bg-gray-100 text-gray-600")}>
                {CATEGORY_LABELS[thread.category]}
              </span>
            )}
            {thread.isSelling && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Spammer
              </span>
            )}
            {thread.isQualified && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-0.5">
                <Star size={10} className="fill-current" aria-hidden="true" />
                Qualified
              </span>
            )}
            {thread.isPartner && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-0.5">
                <Handshake size={10} aria-hidden="true" />
                Partner
              </span>
            )}
            {thread.unreadCount > 0 && (
              <span className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold px-1">
                {thread.unreadCount}
              </span>
            )}
            {thread.wampScore != null && thread.wampScore > 0 && (
              <WampBadgeInline score={thread.wampScore} />
            )}
            {snoozeLabel && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400">{snoozeLabel}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function WampBadgeInline({ score }: { score: number }) {
  const band = getWampBand(score)
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", band.color)}>
      {score} {band.label}
    </span>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" })
}

function formatSnoozeUntil(iso: string): string {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return ""
  const hours = Math.ceil(diff / 3600000)
  if (hours < 24) return `Snoozed ${hours}h`
  return `Snoozed until ${d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" })}`
}
