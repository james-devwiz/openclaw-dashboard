"use client" // Required for interactive form inputs and toggle buttons

import { X, ShieldX } from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_IDEA_CATEGORIES, ALL_IDEA_SOURCE_TYPES, ALL_CONTENT_FORMATS, CONTENT_FORMAT_COLORS } from "@/lib/content-constants"

import type { IdeaCategory, IdeaSourceType, ContentFormat } from "@/types/index"

export function RejectionPanel({ rejection, onDismiss }: {
  rejection: { score: number; reasoning: string; evidence: string }; onDismiss: () => void
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldX size={16} className="text-red-500" aria-hidden="true" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">Idea Rejected — Score {rejection.score}/10</span>
        </div>
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-xs" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-red-600 dark:text-red-300">{rejection.reasoning}</p>
      <p className="text-xs text-red-500/80 dark:text-red-400/60 italic">{rejection.evidence}</p>
    </div>
  )
}

export function FormFields({ title, setTitle, topic, setTopic, researchNotes, setResearchNotes, priority, setPriority, categories, toggleCat, isContentIdea, formats, toggleFormat, sourceUrl, setSourceUrl, sourceType, setSourceType }: {
  title: string; setTitle: (v: string) => void; topic: string; setTopic: (v: string) => void
  researchNotes: string; setResearchNotes: (v: string) => void; priority: string; setPriority: (v: string) => void
  categories: Set<IdeaCategory>; toggleCat: (c: IdeaCategory) => void
  isContentIdea: boolean; formats: Set<ContentFormat>; toggleFormat: (f: ContentFormat) => void
  sourceUrl: string; setSourceUrl: (v: string) => void; sourceType: IdeaSourceType | ""; setSourceType: (v: IdeaSourceType | "") => void
}) {
  return (
    <>
      <div>
        <label htmlFor="idea-title" className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
        <input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. AI-powered lead scoring system"
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {ALL_IDEA_CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => toggleCat(cat)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                categories.has(cat) ? "border-blue-500 bg-blue-500/10 text-blue-600" : "border-border text-muted-foreground hover:border-blue-500/30"
              )}>{cat}</button>
          ))}
        </div>
      </div>

      {isContentIdea && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Content Formats</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CONTENT_FORMATS.map((f) => {
              const c = CONTENT_FORMAT_COLORS[f]
              return (
                <button key={f} type="button" onClick={() => toggleFormat(f)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    formats.has(f) ? cn(c.bg, c.text, "border-transparent font-medium") : "border-border text-muted-foreground hover:border-purple-500/30"
                  )}>{f}</button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="idea-topic" className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
        <textarea id="idea-topic" value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="Brief description of the idea..."
          className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" rows={2} />
      </div>

      <div>
        <label htmlFor="idea-notes" className="block text-xs font-medium text-muted-foreground mb-1">Research Notes</label>
        <textarea id="idea-notes" value={researchNotes} onChange={(e) => setResearchNotes(e.target.value)}
          placeholder="Supporting context, links, reasoning..."
          className="w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="idea-source-url" className="block text-xs font-medium text-muted-foreground mb-1">Source URL</label>
          <input id="idea-source-url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div>
          <label htmlFor="idea-source-type" className="block text-xs font-medium text-muted-foreground mb-1">Source Type</label>
          <select id="idea-source-type" value={sourceType} onChange={(e) => setSourceType(e.target.value as IdeaSourceType)}
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">None</option>
            {ALL_IDEA_SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="idea-priority" className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
        <select id="idea-priority" value={priority} onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
    </>
  )
}
