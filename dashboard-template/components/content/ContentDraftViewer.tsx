"use client" // Requires interactive close handler and conditional rendering

import { X, BookmarkPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SITE_CONFIG } from "@/lib/site-config"

import type { ContentItem } from "@/types/index"

interface ContentDraftViewerProps {
  item: ContentItem | null
  onClose: () => void
  onSaveToMemory?: (content: string) => void
}

export default function ContentDraftViewer({ item, onClose, onSaveToMemory }: ContentDraftViewerProps) {
  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Content draft viewer">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-[10px]">{item.contentType}</Badge>
              <Badge variant="secondary" className="text-[10px]">{item.stage}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onSaveToMemory && (item.draft || item.researchNotes) && (
              <button
                onClick={() => onSaveToMemory(item.draft || item.researchNotes || "")}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Save to memory"
                title="Save to memory"
              >
                <BookmarkPlus size={16} className="text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close draft viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {item.topic && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Topic</h3>
              <p className="text-sm text-foreground">{item.topic}</p>
            </section>
          )}

          {item.researchNotes && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Research Notes</h3>
              <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                {item.researchNotes}
              </div>
            </section>
          )}

          {item.draft && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Draft</h3>
              <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                {item.draft}
              </div>
            </section>
          )}

          <section className="border-t border-border pt-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Platform</dt>
                <dd className="font-medium text-foreground">{item.platform}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium text-foreground">{item.source}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="font-medium text-foreground">{item.priority}</dd>
              </div>
              {item.scheduledDate && (
                <div>
                  <dt className="text-muted-foreground">Scheduled</dt>
                  <dd className="font-medium text-foreground">
                    {new Date(item.scheduledDate).toLocaleDateString(SITE_CONFIG.locale)}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
