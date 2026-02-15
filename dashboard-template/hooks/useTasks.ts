"use client" // Requires useState, useEffect, useCallback for task state and optimistic updates

import { useState, useEffect, useCallback } from "react"

import {
  getTasksApi,
  createTaskApi,
  updateTaskStatusApi,
  updateTaskApi,
  deleteTaskApi,
} from "@/services/task.service"

import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskSource, KanbanColumn } from "@/types/index"

const COLUMNS: KanbanColumn[] = [
  { id: "Backlog", name: "Backlog", color: "#9ca3af", tasks: [] },
  { id: "To Do This Week", name: "To Do This Week", color: "#6b7280", tasks: [] },
  { id: "In Progress", name: "In Progress", color: "#3b82f6", tasks: [] },
  { id: "Requires More Info", name: "Requires More Info", color: "#f59e0b", tasks: [] },
  { id: "Blocked", name: "Blocked", color: "#ef4444", tasks: [] },
  { id: "Needs Review", name: "Needs Review", color: "#8b5cf6", tasks: [] },
  { id: "Completed", name: "Completed", color: "#10b981", tasks: [] },
]

export function useTasks(goalId?: string, categoryFilter?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasksApi(goalId)
      setTasks(data)
      setError(null)
    } catch (err) {
      console.error("Tasks fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch tasks")
    } finally {
      setLoading(false)
    }
  }, [goalId])

  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      // Client-side week validation
      if (newStatus === "To Do This Week") {
        const task = tasks.find((t) => t.id === taskId)
        if (!task?.dueDate) {
          alert("Task must have a due date to be scheduled for this week")
          return
        }
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
      try {
        await updateTaskStatusApi(taskId, newStatus)
      } catch {
        fetchTasks()
      }
    },
    [fetchTasks, tasks]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Pick<Task, "name" | "description" | "status" | "priority" | "category" | "dueDate" | "goalId">>) => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } as Task : t)))
      try {
        await updateTaskApi(taskId, updates)
      } catch {
        fetchTasks()
      }
    },
    [fetchTasks]
  )

  const addTask = useCallback(
    async (input: {
      name: string
      description?: string
      status?: TaskStatus
      priority?: TaskPriority
      category?: TaskCategory
      dueDate?: string
      source?: TaskSource
      goalId?: string
    }) => {
      try {
        const task = await createTaskApi(input)
        setTasks((prev) => [task, ...prev])
        return task
      } catch (err) {
        console.error("Task create failed:", err)
        throw err
      }
    },
    []
  )

  const removeTask = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      try {
        await deleteTaskApi(taskId)
      } catch {
        fetchTasks()
      }
    },
    [fetchTasks]
  )

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filtered = categoryFilter ? tasks.filter((t) => t.category === categoryFilter) : tasks

  const columns: KanbanColumn[] = COLUMNS.map((col) => ({
    ...col,
    tasks: filtered
      .filter((t) => t.status === col.id)
      .sort((a, b) => {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }),
  }))

  return { tasks, columns, loading, error, moveTask, updateTask, addTask, removeTask, refetch: fetchTasks }
}
