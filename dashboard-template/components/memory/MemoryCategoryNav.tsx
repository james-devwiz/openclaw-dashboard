"use client" // Requires onClick handlers for category filtering

import { FileCode, Brain, Building2, Workflow, Search, FolderOpen, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

import type { MemoryCategory } from "@/types/index"
import type { LucideIcon } from "lucide-react"

const CATEGORIES: { id: MemoryCategory | "all"; label: string; icon: LucideIcon; desc: string }[] = [
  { id: "core", label: "Core", icon: FileCode, desc: "Operating docs" },
  { id: "business", label: "Business Context", icon: Building2, desc: "Domains & clients" },
  { id: "orchestration", label: "Orchestration", icon: Workflow, desc: "Skills & sub-agents" },
  { id: "memory", label: "Memory & Context", icon: Brain, desc: "Persistent knowledge" },
  { id: "research", label: "Research & Docs", icon: Search, desc: "Articles & transcripts" },
  { id: "projects", label: "Projects", icon: FolderOpen, desc: "Active projects" },
  { id: "uncategorised", label: "Other", icon: FileText, desc: "Uncategorised files" },
  { id: "all", label: "All Files", icon: FileText, desc: "Everything in workspace" },
]

interface MemoryCategoryNavProps {
  selected?: MemoryCategory
  counts: Record<string, number>
  onSelect: (category?: MemoryCategory) => void
}

export default function MemoryCategoryNav({ selected, counts, onSelect }: MemoryCategoryNavProps) {
  const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <nav className="space-y-1" role="navigation" aria-label="Memory categories">
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === "all" ? !selected : selected === cat.id
        const count = cat.id === "all" ? totalCount : (counts[cat.id] || 0)
        const Icon = cat.icon

        if (cat.id !== "all" && count === 0) return null

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id === "all" ? undefined : cat.id as MemoryCategory)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            title={cat.desc}
          >
            <Icon size={14} aria-hidden="true" className="shrink-0" />
            <span className="truncate flex-1 text-left">{cat.label}</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{count}</span>
          </button>
        )
      })}
    </nav>
  )
}
