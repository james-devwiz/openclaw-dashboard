"use client" // Interactive tab switching requires client-side event handling

import { cn } from "@/lib/utils"

const SUB_TABS = [
  { id: "servers", label: "Servers" },
  { id: "tools", label: "Tools" },
  { id: "bindings", label: "Bindings" },
  { id: "observability", label: "Observability" },
] as const

export type McpSubTab = (typeof SUB_TABS)[number]["id"]

interface McpSubTabsProps {
  activeTab: McpSubTab
  onTabChange: (tab: McpSubTab) => void
}

export default function McpSubTabs({ activeTab, onTabChange }: McpSubTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border mb-6">
      {SUB_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 text-sm transition-colors border-b-2 -mb-px",
            activeTab === tab.id
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          aria-label={`${tab.label} tab`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
