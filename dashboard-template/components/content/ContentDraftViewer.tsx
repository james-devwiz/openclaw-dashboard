"use client" // Requires interactive close handler and conditional rendering

import { X, BookmarkPlus, ArrowUpRight, ExternalLink, CheckCircle2, Layers } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { IDEA_CATEGORY_COLORS, CONTENT_FORMAT_COLORS } from "@/lib/content-constants"

import type { ContentItem, IdeaCategory, ContentFormat } from "@/types/index"

interface ContentDraftViewerProps {
  item: ContentItem | null
  onClose: () => void
  onSaveToMemory?: (content: string) => void
  onPromoteToTask?: (item: ContentItem) => void
  onPromoteToPipeline?: (item: ContentItem) => void
}

export default function ContentDraftViewer({ item, onClose, onSaveToMemory, onPromoteToTask, onPromoteToPipeline }: ContentDraftViewerProps) {
  if (!item) return null

  const canPromoteTask = item.contentType === "Idea" && !item.promotedTaskId
  const canPromotePipeline = item.contentType === "Idea" && !!item.ideaCategories?.includes("Content Idea") && !item.promotedPipelineIds?.length

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Content draft viewer">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <SlideOverHeader
          item={item} onClose={onClose}
          canPromoteTask={canPromoteTask} canPromotePipeline={canPromotePipeline}
          onPromoteToTask={onPromoteToTask} onPromoteToPipeline={onPromoteToPipeline}
          onSaveToMemory={onSaveToMemory}
        />
        <SlideOverBody item={item} />
      </div>
    </div>
  )
}

function SlideOverHeader({ item, onClose, canPromoteTask, canPromotePipeline, onPromoteToTask, onPromoteToPipeline, onSaveToMemory }: {
  item: ContentItem; onClose: () => void; canPromoteTask: boolean; canPromotePipeline: boolean
  onPromoteToTask?: (i: ContentItem) => void; onPromoteToPipeline?: (i: ContentItem) => void
  onSaveToMemory?: (c: string) => void
}) {
  return (
    <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="default" className="text-[10px]">{item.contentType}</Badge>
          <Badge variant="secondary" className="text-[10px]">{item.stage}</Badge>
          {item.promotedTaskId && <Badge variant="success" className="text-[10px]"><CheckCircle2 size={10} className="mr-1" aria-hidden="true" />Task</Badge>}
          {item.promotedPipelineIds?.length ? <Badge variant="secondary" className="text-[10px]">{item.promotedPipelineIds.length} Pipeline</Badge> : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {canPromotePipeline && onPromoteToPipeline && (
          <button onClick={() => onPromoteToPipeline(item)} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Promote to pipeline" title="Promote to pipeline">
            <Layers size={16} className="text-purple-500" />
          </button>
        )}
        {canPromoteTask && onPromoteToTask && (
          <button onClick={() => onPromoteToTask(item)} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Promote to task" title="Promote to task">
            <ArrowUpRight size={16} className="text-blue-500" />
          </button>
        )}
        {onSaveToMemory && (item.draft || item.researchNotes) && (
          <button onClick={() => onSaveToMemory(item.draft || item.researchNotes || "")} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Save to memory" title="Save to memory">
            <BookmarkPlus size={16} className="text-muted-foreground" />
          </button>
        )}
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Close draft viewer">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function SlideOverBody({ item }: { item: ContentItem }) {
  return (
    <div className="p-6 space-y-6">
      {item.ideaCategories && item.ideaCategories.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {item.ideaCategories.map((cat: IdeaCategory) => {
              const colors = IDEA_CATEGORY_COLORS[cat]
              return colors ? <span key={cat} className={cn(colors.bg, colors.text, "text-xs px-2.5 py-1 rounded-full font-medium")}>{cat}</span> : null
            })}
          </div>
        </section>
      )}

      {item.contentFormats && item.contentFormats.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Content Formats</h3>
          <div className="flex flex-wrap gap-2">
            {item.contentFormats.map((f: ContentFormat) => {
              const c = CONTENT_FORMAT_COLORS[f]
              return c ? <span key={f} className={cn(c.bg, c.text, "text-xs px-2.5 py-1 rounded-full font-medium")}>{f}</span> : null
            })}
          </div>
        </section>
      )}

      {item.vetScore !== undefined && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">AI Vetting — Score {item.vetScore}/10</h3>
          {item.vetReasoning && <p className="text-sm text-foreground mb-1">{item.vetReasoning}</p>}
          {item.vetEvidence && <p className="text-xs text-muted-foreground italic">{item.vetEvidence}</p>}
        </section>
      )}

      {item.topic && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Topic</h3>
          <p className="text-sm text-foreground">{item.topic}</p>
        </section>
      )}

      {item.researchNotes && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Research Notes</h3>
          <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">{item.researchNotes}</div>
        </section>
      )}

      {item.draft && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Draft</h3>
          <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">{item.draft}</div>
        </section>
      )}

      <section className="border-t border-border pt-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Platform</dt><dd className="font-medium text-foreground">{item.platform}</dd></div>
          <div><dt className="text-muted-foreground">Source</dt><dd className="font-medium text-foreground">{item.source}</dd></div>
          <div><dt className="text-muted-foreground">Priority</dt><dd className="font-medium text-foreground">{item.priority}</dd></div>
          {item.sourceUrl && (
            <div>
              <dt className="text-muted-foreground">Source URL</dt>
              <dd><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs inline-flex items-center gap-1">{item.sourceType || "Link"} <ExternalLink size={10} aria-hidden="true" /></a></dd>
            </div>
          )}
          {item.scheduledDate && (
            <div><dt className="text-muted-foreground">Scheduled</dt><dd className="font-medium text-foreground">{new Date(item.scheduledDate).toLocaleDateString("en-AU")}</dd></div>
          )}
        </dl>
      </section>
    </div>
  )
}
