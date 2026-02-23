import { cn } from "@/lib/utils"
import { FORMAT_COLORS } from "@/lib/studio-constants"
import PlatformBadge from "./PlatformBadge"
import type { Post, PostPlatformEntry } from "@/types"

interface Props {
  post: Post
  platformEntry: PostPlatformEntry
  onClick: (post: Post) => void
}

export default function CalendarPostChip({ post, platformEntry, onClick }: Props) {
  const colors = FORMAT_COLORS[post.format]

  return (
    <button
      onClick={() => onClick(post)}
      className={cn("w-full text-left rounded-md px-2 py-1 text-xs border", colors.bg, "border-transparent hover:border-blue-300 transition-colors")}
      aria-label={post.title}
    >
      <span className={cn("font-medium line-clamp-1", colors.text)}>{post.title}</span>
      <div className="flex items-center gap-1 mt-0.5">
        <PlatformBadge platform={platformEntry.platform} status={platformEntry.platformStatus} compact />
        {platformEntry.scheduledAt && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(platformEntry.scheduledAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Brisbane" })}
          </span>
        )}
      </div>
    </button>
  )
}
