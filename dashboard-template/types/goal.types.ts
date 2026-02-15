import { SITE_CONFIG } from "@/lib/site-config"

export type GoalStatus = "Active" | "Achieved" | "Paused" | "Abandoned"
export type GoalCategory = (typeof SITE_CONFIG.goalCategories)[number]

export interface Goal {
  id: string
  name: string
  description: string
  status: GoalStatus
  category: GoalCategory
  targetDate?: string
  progress: number
  metric: string
  currentValue: string
  targetValue: string
  priority: "High" | "Medium" | "Low"
  taskCount?: number
  recurringCount?: number
  createdAt: string
  updatedAt: string
}
