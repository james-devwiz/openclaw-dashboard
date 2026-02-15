import { Hash, Send, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"

import type { HealthStatus } from "@/types/index"
import type { LucideIcon } from "lucide-react"

interface ChannelStatusCardProps {
  health: HealthStatus | null
}

const CHANNELS: { key: "slack" | "telegram" | "notion"; label: string; icon: LucideIcon; bg: string; fg: string }[] = [
  { key: "slack", label: "Slack", icon: Hash, bg: "bg-purple-50 dark:bg-purple-900/20", fg: "text-purple-600 dark:text-purple-400" },
  { key: "telegram", label: "Telegram", icon: Send, bg: "bg-blue-50 dark:bg-blue-900/20", fg: "text-blue-600 dark:text-blue-400" },
  { key: "notion", label: "Notion", icon: BookOpen, bg: "bg-muted", fg: "text-muted-foreground" },
]

export function ChannelStatusCard({ health }: ChannelStatusCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Channels</h3>
      <div className="space-y-3" role="list" aria-label="Channel connection status">
        {CHANNELS.map(({ key, label, icon: Icon, bg, fg }) => {
          const connected = health?.channels?.[key]?.connected ?? false
          return (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              role="listitem"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", bg)}>
                  <Icon className={cn("h-4 w-4", fg)} aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    connected ? "bg-emerald-500" : "bg-red-500"
                  )}
                  aria-hidden="true"
                />
                <span className={cn(
                  "text-xs font-medium",
                  connected ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
