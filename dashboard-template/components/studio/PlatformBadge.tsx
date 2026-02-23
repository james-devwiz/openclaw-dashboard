import { Linkedin, Youtube, Instagram, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/studio-constants"
import type { PostPlatform, PlatformStatus } from "@/types"

const ICONS: Record<PostPlatform, typeof Linkedin> = {
  linkedin: Linkedin, youtube: Youtube, instagram: Instagram, blog: Globe,
}

const STATUS_DOT: Record<PlatformStatus, string> = {
  draft: "bg-gray-400", scheduled: "bg-cyan-500", published: "bg-green-500", failed: "bg-red-500",
}

interface Props {
  platform: PostPlatform
  status?: PlatformStatus
  compact?: boolean
}

export default function PlatformBadge({ platform, status, compact }: Props) {
  const Icon = ICONS[platform]
  const colors = PLATFORM_COLORS[platform]

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", colors.bg, colors.text)}>
      <Icon size={12} aria-hidden="true" />
      {!compact && PLATFORM_LABELS[platform]}
      {status && <span className={cn("ml-1 size-1.5 rounded-full", STATUS_DOT[status])} />}
    </span>
  )
}
