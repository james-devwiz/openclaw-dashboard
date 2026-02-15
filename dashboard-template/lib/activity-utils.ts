// Activity display helpers — icons, colours, grouping, labels

import {
  KanbanSquare,
  Target,
  FileText,
  Bell,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  Layers,
  MessageSquare,
  Newspaper,
  HeartPulse,
  Brain,
  FolderOpen,
} from "lucide-react"

import type { LucideIcon } from "lucide-react"
import type { ActivityItem, ActivityEntityType, ActivityAction, ActivityGroup } from "@/types/activity.types"
import { SITE_CONFIG } from "@/lib/site-config"

export function getActivityConfig(entityType: ActivityEntityType): {
  icon: LucideIcon
  bg: string
  fg: string
} {
  switch (entityType) {
    case "task": return { icon: KanbanSquare, bg: "bg-blue-50 dark:bg-blue-900/20", fg: "text-blue-600 dark:text-blue-400" }
    case "goal": return { icon: Target, bg: "bg-green-50 dark:bg-green-900/20", fg: "text-green-600 dark:text-green-400" }
    case "content": return { icon: FileText, bg: "bg-purple-50 dark:bg-purple-900/20", fg: "text-purple-600 dark:text-purple-400" }
    case "approval": return { icon: Bell, bg: "bg-orange-50 dark:bg-orange-900/20", fg: "text-orange-600 dark:text-orange-400" }
    case "chat": return { icon: MessageSquare, bg: "bg-cyan-50 dark:bg-cyan-900/20", fg: "text-cyan-600 dark:text-cyan-400" }
    case "brief": return { icon: Newspaper, bg: "bg-amber-50 dark:bg-amber-900/20", fg: "text-amber-600 dark:text-amber-400" }
    case "heartbeat": return { icon: HeartPulse, bg: "bg-pink-50 dark:bg-pink-900/20", fg: "text-pink-600 dark:text-pink-400" }
    case "memory": return { icon: Brain, bg: "bg-emerald-50 dark:bg-emerald-900/20", fg: "text-emerald-600 dark:text-emerald-400" }
    case "project": return { icon: FolderOpen, bg: "bg-indigo-50 dark:bg-indigo-900/20", fg: "text-indigo-600 dark:text-indigo-400" }
    default: return { icon: FileText, bg: "bg-gray-50 dark:bg-gray-900/20", fg: "text-gray-600 dark:text-gray-400" }
  }
}

export function getActionIcon(action: ActivityAction): LucideIcon {
  switch (action) {
    case "created": return Plus
    case "updated": return Pencil
    case "deleted": return Trash2
    case "status_changed": return ArrowRight
    case "stage_changed": return Layers
    case "responded": return MessageSquare
    default: return Pencil
  }
}

export function getActionLabel(action: ActivityAction): string {
  switch (action) {
    case "created": return "Created"
    case "updated": return "Updated"
    case "deleted": return "Deleted"
    case "status_changed": return "Status changed"
    case "stage_changed": return "Stage changed"
    case "responded": return "Responded"
    default: return "Updated"
  }
}

export function groupActivitiesByDate(items: ActivityItem[]): ActivityGroup[] {
  const groups = new Map<string, ActivityItem[]>()
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  for (const item of items) {
    const d = new Date(item.createdAt)
    let label: string
    if (d.toDateString() === today) label = "Today"
    else if (d.toDateString() === yesterday) label = "Yesterday"
    else label = d.toLocaleDateString(SITE_CONFIG.locale, { day: "numeric", month: "short" })

    const existing = groups.get(label)
    if (existing) existing.push(item)
    else groups.set(label, [item])
  }

  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }))
}
