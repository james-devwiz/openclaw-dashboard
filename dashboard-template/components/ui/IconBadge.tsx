import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"

const iconBadgeVariants = cva(
  "rounded-lg flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-blue-500/20 text-blue-500",
        success: "bg-emerald-500/20 text-emerald-500",
        warning: "bg-amber-500/20 text-amber-500",
        error: "bg-red-500/20 text-red-500",
        info: "bg-blue-500/20 text-blue-500",
        purple: "bg-purple-500/20 text-purple-500",
        indigo: "bg-indigo-500/20 text-indigo-500",
        teal: "bg-teal-500/20 text-teal-500",
      },
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const ICON_SIZES = { sm: 14, md: 18, lg: 22 } as const

interface IconBadgeProps extends VariantProps<typeof iconBadgeVariants> {
  icon: LucideIcon
  className?: string
}

export default function IconBadge({
  icon: Icon,
  variant,
  size = "md",
  className,
}: IconBadgeProps) {
  return (
    <div className={cn(iconBadgeVariants({ variant, size }), className)}>
      <Icon size={ICON_SIZES[size || "md"]} />
    </div>
  )
}
