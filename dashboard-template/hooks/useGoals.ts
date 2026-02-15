"use client" // Requires useState, useEffect, useCallback for goal state management

import { useState, useEffect, useCallback } from "react"

import { getGoalsApi, createGoalApi, updateGoalApi, deleteGoalApi } from "@/services/goal.service"

import type { Goal } from "@/types/index"

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    try {
      const data = await getGoalsApi()
      setGoals(data)
      setError(null)
    } catch (err) {
      console.error("Goals fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch goals")
    } finally {
      setLoading(false)
    }
  }, [])

  const addGoal = useCallback(async (input: {
    name: string
    description?: string
    category?: string
    targetDate?: string
    metric?: string
    targetValue?: string
    priority?: string
  }) => {
    const goal = await createGoalApi(input)
    setGoals((prev) => [goal, ...prev])
    return goal
  }, [])

  const editGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)))
    try {
      await updateGoalApi(goalId, updates)
    } catch {
      fetchGoals()
    }
  }, [fetchGoals])

  const removeGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    try {
      await deleteGoalApi(goalId)
    } catch {
      fetchGoals()
    }
  }, [fetchGoals])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return { goals, loading, error, addGoal, editGoal, removeGoal, refetch: fetchGoals }
}
