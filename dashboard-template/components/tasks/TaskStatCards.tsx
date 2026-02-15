"use client" // Requires useEffect, useState for stats fetching

import { useState, useEffect } from "react"

import { KanbanSquare, Calendar, Clock, Loader2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTaskStatsApi, type TaskStats } from "@/services/task.service"

interface TaskStatCardsProps {
  category?: string
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: {
  icon: React.ElementType; label: string; value: string | number; iconBg: string; iconColor: string
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function TaskStatCards({ category }: TaskStatCardsProps) {
  const [stats, setStats] = useState<TaskStats | null>(null)

  useEffect(() => {
    getTaskStatsApi(category).then(setStats).catch(console.error)
  }, [category])

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm animate-pulse h-[72px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <StatCard icon={KanbanSquare} label="Total Tasks" value={stats.total}
        iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
      <StatCard icon={Calendar} label="This Week" value={stats.thisWeek}
        iconBg="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-600 dark:text-purple-400" />
      <StatCard icon={Clock} label="Today" value={stats.today}
        iconBg="bg-orange-50 dark:bg-orange-900/20" iconColor="text-orange-600 dark:text-orange-400" />
      <StatCard icon={Loader2} label="In Progress" value={stats.inProgress}
        iconBg="bg-cyan-50 dark:bg-cyan-900/20" iconColor="text-cyan-600 dark:text-cyan-400" />
      <StatCard icon={TrendingUp} label="Completion" value={`${stats.completionPercent}%`}
        iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
    </div>
  )
}
