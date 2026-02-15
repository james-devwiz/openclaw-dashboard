"use client" // Requires useState for active tab, modal state, selected task; hooks for data; useSearchParams for deep linking

import { Suspense, useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"

import { Plus, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/layout/PageHeader"
import TaskOverview from "@/components/tasks/TaskOverview"
import GoalsTab from "@/components/goals/GoalsTab"
import TaskKanban from "@/components/tasks/TaskKanban"
import TaskSlideOver from "@/components/tasks/TaskSlideOver"
import CreateTaskModal from "@/components/tasks/CreateTaskModal"
import CreateGoalModal from "@/components/goals/CreateGoalModal"
import CreateRecurringModal from "@/components/tasks/CreateRecurringModal"
import RecurringTable from "@/components/tasks/RecurringTable"
import { useTasks } from "@/hooks/useTasks"
import { useGoals } from "@/hooks/useGoals"

import type { Task } from "@/types/index"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "goals", label: "Goals" },
  { id: "tasks", label: "Tasks" },
  { id: "recurring", label: "Recurring" },
]

function GoalsPageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [showCreateRecurring, setShowCreateRecurring] = useState(false)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab)
  }, [searchParams])

  const { columns, moveTask, updateTask, addTask, removeTask, refetch: refetchTasks } = useTasks()
  const { addGoal, refetch: refetchGoals } = useGoals()

  const handleNewClick = useCallback(() => {
    if (activeTab === "recurring") setShowCreateRecurring(true)
    else if (activeTab === "tasks") setShowCreateTask(true)
    else if (activeTab === "goals") setShowCreateGoal(true)
    else setShowCreateTask(true)
  }, [activeTab])

  const handleTaskClick = useCallback((task: Task) => setSelectedTask(task), [])
  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates)
    setSelectedTask((prev) => prev?.id === taskId ? { ...prev, ...updates } as Task : prev)
  }, [updateTask])

  return (
    <div>
      <PageHeader
        title="Goals & Tasks"
        subtitle="Set goals, track progress, manage tasks"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1" role="tablist" aria-label="Goals and Tasks tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-card text-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleNewClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              aria-label="Create new item"
            >
              <Plus size={14} aria-hidden="true" />
              New
            </button>
            <button
              onClick={() => { refetchTasks(); refetchGoals() }}
              className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        }
      />

      <div role="tabpanel" aria-label={`${activeTab} panel`}>
        {activeTab === "overview" && <TaskOverview />}
        {activeTab === "goals" && <GoalsTab />}
        {activeTab === "tasks" && (
          <TaskKanban columns={columns} onMove={moveTask} onTaskClick={handleTaskClick} onDelete={removeTask} />
        )}
        {activeTab === "recurring" && <RecurringTable />}
      </div>

      <TaskSlideOver task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleTaskUpdate} onDelete={removeTask} onTaskNavigate={handleTaskClick} />

      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreateManual={async (input) => { await addTask(input) }}
        onChatCreated={refetchTasks}
      />

      <CreateGoalModal
        open={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onCreateManual={async (input) => { await addGoal(input) }}
        onChatCreated={refetchGoals}
      />

      <CreateRecurringModal
        open={showCreateRecurring}
        onClose={() => setShowCreateRecurring(false)}
      />
    </div>
  )
}

export default function GoalsPage() {
  return (
    <Suspense>
      <GoalsPageContent />
    </Suspense>
  )
}
