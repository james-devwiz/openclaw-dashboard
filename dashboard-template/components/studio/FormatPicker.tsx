"use client" // Requires onClick handlers for format selection

import { FileText, Image, Video, Film, BookOpen, Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import { FORMAT_LABELS, FORMAT_COLORS } from "@/lib/studio-constants"
import type { PostFormat } from "@/types"

const ICONS: Record<PostFormat, typeof FileText> = {
  text: FileText, carousel: Image, short_video: Video,
  long_video: Film, blog: BookOpen, quote_card: Quote,
}

const FORMAT_DESC: Record<PostFormat, string> = {
  text: "LinkedIn text post", carousel: "Swipeable slides",
  short_video: "Under 60s reel/short", long_video: "YouTube long-form",
  blog: "Full article", quote_card: "Visual quote",
}

interface Props {
  selected: PostFormat
  onSelect: (format: PostFormat) => void
}

export default function FormatPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(Object.keys(FORMAT_LABELS) as PostFormat[]).map((format) => {
        const Icon = ICONS[format]
        const colors = FORMAT_COLORS[format]
        const isActive = selected === format
        return (
          <button
            key={format}
            onClick={() => onSelect(format)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 border-2 transition-all text-center",
              isActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-300",
            )}
            aria-label={FORMAT_LABELS[format]}
          >
            <span className={cn("rounded-lg p-2", colors.bg)}>
              <Icon size={18} className={colors.text} aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-foreground">{FORMAT_LABELS[format]}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{FORMAT_DESC[format]}</span>
          </button>
        )
      })}
    </div>
  )
}
