"use client" // Requires useState for goal selection/filter, useGoals for data

import { useState } from "react"

import { Target } from "lucide-react"
import GoalCard from "./GoalCard"
import GoalFilters from "./GoalFilters"
import GoalSlideOver from "./GoalSlideOver"
import EmptyState from "@/components/ui/EmptyState"
import { useGoals } from "@/hooks/useGoals"

export default function GoalsTab() {
  const { goals, loading, editGoal } = useGoals()
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedGoal, setSelectedGoal] = useState<typeof goals[number] | null>(null)

  const filteredGoals = categoryFilter === "all" ? goals : goals.filter((g) => g.category === categoryFilter)

  const handleGoalClick = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId) || null
    setSelectedGoal(goal)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <GoalFilters selected={categoryFilter} onChange={setCategoryFilter} />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading goals...</p>
      ) : filteredGoals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Goals will appear here once created" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              taskCount={goal.taskCount || 0}
              recurringCount={goal.recurringCount || 0}
              isSelected={selectedGoal?.id === goal.id}
              onSelect={handleGoalClick}
            />
          ))}
        </div>
      )}

      <GoalSlideOver
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onUpdate={editGoal}
      />
    </div>
  )
}
