"use client" // Requires onClick for tab switching

import { MessageSquare, FileText, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProjectTab = "chat" | "instructions" | "knowledge"

const TABS = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "instructions" as const, label: "Instructions", icon: FileText },
  { id: "knowledge" as const, label: "Knowledge Base", icon: BookOpen },
]

interface ProjectTabsProps {
  activeTab: ProjectTab
  onTabChange: (tab: ProjectTab) => void
  fileCount?: number
}

export default function ProjectTabs({ activeTab, onTabChange, fileCount }: ProjectTabsProps) {
  return (
    <div className="flex border-b border-border mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === tab.id
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <tab.icon size={16} aria-hidden="true" />
          {tab.label}
          {tab.id === "knowledge" && fileCount !== undefined && fileCount > 0 && (
            <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              {fileCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
