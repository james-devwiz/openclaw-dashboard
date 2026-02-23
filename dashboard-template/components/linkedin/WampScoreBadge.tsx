import { cn } from "@/lib/utils"
import { getWampBand } from "@/lib/linkedin-constants"

interface WampScoreBadgeProps {
  score: number
  size?: "sm" | "md"
  business?: string | null
}

export default function WampScoreBadge({ score, size = "sm", business }: WampScoreBadgeProps) {
  const band = getWampBand(score)
  const textSize = size === "sm" ? "text-[10px]" : "text-xs"
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1"

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn(textSize, padding, "rounded-full font-medium inline-flex items-center gap-1", band.color)}>
        {score <= 20 && <span aria-hidden="true">&#10052;</span>}
        {score >= 81 && <span aria-hidden="true">&#128293;</span>}
        {score} &mdash; {band.label}
      </span>
      {business && size === "md" && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
          {business}
        </span>
      )}
    </span>
  )
}
