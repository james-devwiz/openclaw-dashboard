"use client" // Requires onClick handlers for platform toggle

import { Linkedin, Youtube, Instagram, Globe, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_PLATFORMS, PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/studio-constants"
import type { PostPlatform, PostPlatformEntry } from "@/types"

const ICONS: Record<PostPlatform, typeof Linkedin> = {
  linkedin: Linkedin, youtube: Youtube, instagram: Instagram, blog: Globe,
}

interface Props {
  platforms: PostPlatformEntry[]
  onAdd: (platform: PostPlatform) => void
  onRemove: (platformId: string) => void
}

export default function ComposerPlatforms({ platforms, onAdd, onRemove }: Props) {
  const activePlatforms = new Set(platforms.map((p) => p.platform))

  return (
    <div>
      <label className="text-xs font-medium text-foreground mb-2 block">Platforms</label>
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((platform) => {
          const Icon = ICONS[platform]
          const colors = PLATFORM_COLORS[platform]
          const isActive = activePlatforms.has(platform)
          const entry = platforms.find((p) => p.platform === platform)

          return (
            <button
              key={platform}
              onClick={() => isActive && entry ? onRemove(entry.id) : onAdd(platform)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm border-2 transition-all",
                isActive
                  ? cn("border-current", colors.bg, colors.text)
                  : "border-border text-muted-foreground hover:border-blue-300"
              )}
              aria-label={isActive ? `Remove ${PLATFORM_LABELS[platform]}` : `Add ${PLATFORM_LABELS[platform]}`}
            >
              <Icon size={14} aria-hidden="true" />
              {PLATFORM_LABELS[platform]}
              {isActive && <X size={12} className="ml-1" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
