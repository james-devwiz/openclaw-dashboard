"use client" // Requires onClick handlers for toggle state

import { Globe, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"

export type ResearchMode = "search" | "deep" | null

interface ResearchModeButtonsProps {
  mode: ResearchMode
  onChange: (mode: ResearchMode) => void
}

export default function ResearchModeButtons({ mode, onChange }: ResearchModeButtonsProps) {
  return (
    <>
      <button
        onClick={() => onChange(mode === "search" ? null : "search")}
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-colors",
          mode === "search"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            : "bg-accent/50 text-muted-foreground hover:text-foreground",
        )}
        aria-label="Toggle web search mode"
      >
        <Globe size={12} />
        Search
      </button>
      <button
        onClick={() => onChange(mode === "deep" ? null : "deep")}
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-colors",
          mode === "deep"
            ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600"
            : "bg-accent/50 text-muted-foreground hover:text-foreground",
        )}
        aria-label="Toggle deep research mode"
      >
        <BookOpen size={12} />
        Deep Research
      </button>
    </>
  )
}
