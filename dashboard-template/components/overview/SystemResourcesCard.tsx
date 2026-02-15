import { Cpu, MemoryStick, HardDrive } from "lucide-react"

import { cn } from "@/lib/utils"

import type { HealthStatus } from "@/types/index"

interface SystemResourcesCardProps {
  health: HealthStatus | null
}

const RESOURCES = [
  { label: "CPU", key: "cpu" as const, icon: Cpu },
  { label: "Memory", key: "memory" as const, icon: MemoryStick },
  { label: "Disk", key: "disk" as const, icon: HardDrive },
]

function getBarColor(value: number): string {
  if (value >= 80) return "bg-red-500"
  if (value >= 60) return "bg-amber-500"
  return "bg-emerald-500"
}

function getTextColor(value: number): string {
  if (value >= 80) return "text-red-600 dark:text-red-400"
  if (value >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-emerald-600 dark:text-emerald-400"
}

export function SystemResourcesCard({ health }: SystemResourcesCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">System</h3>
      <div className="space-y-4" role="list" aria-label="System resource usage">
        {RESOURCES.map(({ label, key, icon: Icon }) => {
          const value = health?.system?.[key]
          return (
            <div key={label} role="listitem">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold",
                    value != null ? getTextColor(value) : "text-muted-foreground"
                  )}
                >
                  {value != null ? `${value}%` : "\u2014"}
                </span>
              </div>
              <div
                className="w-full h-2 bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={value ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label} usage`}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    getBarColor(value ?? 0)
                  )}
                  style={{ width: `${value ?? 0}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
