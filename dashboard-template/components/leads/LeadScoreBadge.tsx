import { getScoreLevel, SCORE_LABELS } from "@/lib/lead-constants"
import { cn } from "@/lib/utils"

interface LeadScoreBadgeProps {
  score: number
  className?: string
}

export default function LeadScoreBadge({ score, className }: LeadScoreBadgeProps) {
  const level = getScoreLevel(score)
  const { color, bg } = SCORE_LABELS[level]

  return (
    <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", bg, color, className)}>
      {score}
    </span>
  )
}
