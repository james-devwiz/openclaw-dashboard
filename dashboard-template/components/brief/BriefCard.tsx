import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"

const ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  default: { bg: "bg-muted", fg: "text-muted-foreground" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-900/20", fg: "text-emerald-600 dark:text-emerald-400" },
  warning: { bg: "bg-amber-50 dark:bg-amber-900/20", fg: "text-amber-600 dark:text-amber-400" },
  error: { bg: "bg-red-50 dark:bg-red-900/20", fg: "text-red-600 dark:text-red-400" },
  info: { bg: "bg-blue-50 dark:bg-blue-900/20", fg: "text-blue-600 dark:text-blue-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", fg: "text-purple-600 dark:text-purple-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", fg: "text-indigo-600 dark:text-indigo-400" },
  teal: { bg: "bg-teal-50 dark:bg-teal-900/20", fg: "text-teal-600 dark:text-teal-400" },
}

const ACCENT_COLORS: Record<string, string> = {
  default: "border-l-muted-foreground",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
  purple: "border-l-purple-500",
  indigo: "border-l-indigo-500",
  teal: "border-l-teal-500",
}

interface BriefCardProps {
  icon: LucideIcon
  iconVariant?: "default" | "success" | "warning" | "error" | "info" | "purple" | "indigo" | "teal"
  title: string
  badge?: string
  children: React.ReactNode
}

export function BriefCard({
  icon: Icon,
  iconVariant = "default",
  title,
  badge,
  children,
}: BriefCardProps) {
  const colors = ICON_COLORS[iconVariant] || ICON_COLORS.default
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card shadow-sm border-l-3",
      ACCENT_COLORS[iconVariant]
    )}>
      <div className="p-6 pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <Icon className={cn("h-4 w-4", colors.fg)} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {badge && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  )
}
