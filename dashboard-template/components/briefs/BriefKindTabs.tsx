"use client" // Requires onClick handlers for kind tab selection

import { FileText, ClipboardList } from "lucide-react"

import { cn } from "@/lib/utils"

import type { BriefKind } from "@/types"

interface BriefKindTabsProps {
  activeKind: BriefKind | ""
  onKindChange: (kind: BriefKind | "") => void
}

const KINDS: Array<{ value: BriefKind | ""; label: string; icon: typeof FileText }> = [
  { value: "", label: "All", icon: FileText },
  { value: "brief", label: "Briefs", icon: FileText },
  { value: "report", label: "Reports", icon: ClipboardList },
]

export function BriefKindTabs({ activeKind, onKindChange }: BriefKindTabsProps) {
  return (
    <div className="flex rounded-lg border border-border bg-card overflow-hidden" role="tablist" aria-label="Filter by kind">
      {KINDS.map(({ value, label, icon: Icon }) => (
        <button
          key={value || "all"}
          role="tab"
          aria-selected={activeKind === value}
          onClick={() => onKindChange(value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
            activeKind === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon size={13} aria-hidden="true" /> {label}
        </button>
      ))}
    </div>
  )
}
