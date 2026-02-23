"use client" // Requires onClick handler for post selection

import { FileText, Image, Video, Film, BookOpen, Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import { FORMAT_LABELS, FORMAT_COLORS } from "@/lib/studio-constants"
import PlatformBadge from "./PlatformBadge"
import type { Post, PostFormat } from "@/types"

const ICONS: Record<PostFormat, typeof FileText> = {
  text: FileText, carousel: Image, short_video: Video,
  long_video: Film, blog: BookOpen, quote_card: Quote,
}

interface Props {
  post: Post
  onClick: (post: Post) => void
}

export default function StudioPostCard({ post, onClick }: Props) {
  const Icon = ICONS[post.format]
  const colors = FORMAT_COLORS[post.format]

  return (
    <button
      onClick={() => onClick(post)}
      className="w-full text-left rounded-lg bg-card border border-border p-3 hover:shadow-md transition-shadow cursor-pointer"
      aria-label={`Open post: ${post.title}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className={cn("shrink-0 rounded-md p-1", colors.bg)}>
          <Icon size={12} className={colors.text} aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground line-clamp-2 flex-1">{post.title}</span>
      </div>

      {post.hook && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2 italic">{post.hook}</p>
      )}

      <div className="flex items-center gap-1 flex-wrap">
        <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-medium", colors.bg, colors.text)}>
          {FORMAT_LABELS[post.format]}
        </span>
        {post.platforms.map((p) => (
          <PlatformBadge key={p.id} platform={p.platform} status={p.platformStatus} compact />
        ))}
        {post.priority === "High" && (
          <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            High
          </span>
        )}
      </div>
    </button>
  )
}
