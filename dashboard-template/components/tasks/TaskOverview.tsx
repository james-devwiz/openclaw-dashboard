"use client" // Requires useState for category filter state

import { useState } from "react"

import { cn } from "@/lib/utils"
import { ALL_CATEGORIES } from "@/lib/task-constants"
import TaskStatCards from "./TaskStatCards"
import { ActivityFeed } from "@/components/overview/ActivityFeed"
import { useActivity } from "@/hooks/useActivity"

export default function TaskOverview() {
  const [category, setCategory] = useState<string | undefined>(undefined)
  const { items: activity } = useActivity({ entityType: "task", limit: 15 })

  const filters = [{ id: "all", label: "All" }, ...ALL_CATEGORIES.map((c) => ({ id: c, label: c }))]

  return (
    <div>
      <TaskStatCards category={category} />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setCategory(f.id === "all" ? undefined : f.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors border",
              (f.id === "all" && !category) || f.id === category
                ? "bg-foreground text-background border-foreground font-medium"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
            aria-label={`Filter by ${f.label}`}
            aria-pressed={(f.id === "all" && !category) || f.id === category}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <ActivityFeed items={activity} />
      </section>
    </div>
  )
}
