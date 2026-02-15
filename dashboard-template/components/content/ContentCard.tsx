"use client" // Requires draggable interaction and onClick handler

import { Calendar, GripVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SITE_CONFIG } from "@/lib/site-config"

import type { ContentItem } from "@/types/index"

const TYPE_VARIANTS: Record<string, "default" | "secondary" | "warning" | "success"> = {
  "YouTube Script": "default",
  "Newsletter": "secondary",
  "Blog Post": "warning",
  "Meeting Transcript": "secondary",
  "General Dictation": "secondary",
  "LinkedIn Content": "default",
}

interface ContentCardProps {
  item: ContentItem
  onDragStart: (e: React.DragEvent, item: ContentItem) => void
  onClick: (item: ContentItem) => void
}

export default function ContentCard({ item, onDragStart, onClick }: ContentCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onClick={() => onClick(item)}
      className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-500/30 transition-all duration-200 group"
      role="listitem"
      aria-label={`Content: ${item.title}, type ${item.contentType}, stage ${item.stage}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={14}
          className="text-muted-foreground/30 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
          {item.topic && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.topic}</p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant={TYPE_VARIANTS[item.contentType] || "secondary"} className="text-[10px]">
              {item.contentType}
            </Badge>
            {item.scheduledDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={10} aria-hidden="true" />
                {new Date(item.scheduledDate).toLocaleDateString(SITE_CONFIG.locale, { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
