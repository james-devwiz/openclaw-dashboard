"use client" // Requires useState/useEffect for async skill doc loading + keyboard listener

import { useState, useEffect, useCallback } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { getSkillDetail } from "@/services/architecture.service"
import MarkdownMessage from "@/components/chat/MarkdownMessage"
import MissingReasons from "./MissingReasons"
import type { SkillInfo } from "@/types/index"

interface SkillDetailPanelProps {
  skill: SkillInfo | null
  onClose: () => void
}

export default function SkillDetailPanel({ skill, onClose }: SkillDetailPanelProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!skill) return
    setLoading(true)
    setError(null)
    setContent(null)
    getSkillDetail(skill.name)
      .then((data) => setContent(data.content))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [skill])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    if (!skill) return
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [skill, handleKeyDown])

  if (!skill) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Skill documentation viewer">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-card border-l border-border shadow-2xl overflow-y-auto">
        <StickyHeader skill={skill} onClose={onClose} />
        <div className="p-6">
          <p className="text-sm text-foreground leading-relaxed mb-4">{skill.description}</p>
          {skill.status === "missing" && (
            <div className="mb-4">
              <MissingReasons skill={skill} />
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading documentation...</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-muted-foreground italic py-4">No documentation available for this skill.</p>
          )}
          {content && (
            <div className="border-t border-border pt-4 text-sm">
              <MarkdownMessage content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StickyHeader({ skill, onClose }: { skill: SkillInfo; onClose: () => void }) {
  return (
    <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
      <div className="min-w-0 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{skill.emoji}</span>
        <div>
          <h2 className="text-lg font-semibold text-foreground truncate">{skill.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium",
              skill.status === "ready"
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
            )}>
              {skill.status}
            </span>
            <span className="text-xs text-muted-foreground">{skill.source}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {skill.homepage && (
          <a
            href={skill.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Open homepage"
          >
            <ExternalLink size={16} />
          </a>
        )}
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close panel">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
