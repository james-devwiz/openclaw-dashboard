import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const ringVariants = cva("", {
  variants: {
    size: {
      sm: "w-10 h-10",
      md: "w-14 h-14",
      lg: "w-20 h-20",
    },
    variant: {
      default: "text-claw-blue",
      success: "text-emerald-500",
      warning: "text-amber-500",
    },
  },
  defaultVariants: { size: "md", variant: "default" },
})

const SIZES = { sm: { r: 16, sw: 3 }, md: { r: 22, sw: 4 }, lg: { r: 32, sw: 5 } } as const

interface ProgressRingProps extends VariantProps<typeof ringVariants> {
  value: number
  className?: string
  showLabel?: boolean
}

export default function ProgressRing({ value, size = "md", variant, className, showLabel = true }: ProgressRingProps) {
  const { r, sw } = SIZES[size || "md"]
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const viewBox = (r + sw) * 2

  return (
    <div className={cn("relative inline-flex items-center justify-center", ringVariants({ size }), className)}>
      <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="w-full h-full -rotate-90">
        <circle
          cx={r + sw} cy={r + sw} r={r}
          fill="none" stroke="currentColor" strokeWidth={sw}
          className="opacity-15"
        />
        <circle
          cx={r + sw} cy={r + sw} r={r}
          fill="none" stroke="currentColor" strokeWidth={sw}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(ringVariants({ variant }))}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold text-foreground">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}
