import { Target, KanbanSquare, Newspaper, Bell, Brain, FileText } from "lucide-react"

import type { SearchResult } from "@/types/index"

const TYPE_ICONS: Record<string, typeof Target> = {
  goal: Target,
  task: KanbanSquare,
  content: Newspaper,
  approval: Bell,
  memory: Brain,
  document: FileText,
}

interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
}

export default function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const Icon = TYPE_ICONS[result.type] || Target

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-accent"
      }`}
      role="option"
      aria-selected={isSelected}
    >
      <div className="p-1.5 rounded-md bg-muted shrink-0">
        <Icon size={14} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
      </div>
      <span className="text-[10px] text-muted-foreground capitalize shrink-0">{result.type}</span>
    </button>
  )
}
