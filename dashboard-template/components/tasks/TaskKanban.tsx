"use client" // Requires useState for drag state, useCallback for drag handlers

import { useState, useCallback } from "react"

import { cn } from "@/lib/utils"
import { COLUMN_COLORS } from "@/lib/task-constants"
import TaskKanbanCard from "./TaskKanbanCard"

import type { Task, TaskStatus, KanbanColumn } from "@/types/index"

interface TaskKanbanProps {
  columns: KanbanColumn[]
  onMove: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export default function TaskKanban({ columns, onMove, onTaskClick, onDelete }: TaskKanbanProps) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const taskId = e.dataTransfer.getData("taskId")
    if (taskId) onMove(taskId, columnId)
  }, [onMove])

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max" role="region" aria-label="Task board">
        {columns.map((col) => {
          const colors = COLUMN_COLORS[col.id]
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.id) }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                "w-72 shrink-0 rounded-3xl p-5 transition-all duration-200 min-h-[200px]",
                "bg-card/20 backdrop-blur-xl border border-border/50",
                dragOverColumn === col.id && "border-blue-500/50 bg-blue-500/5"
              )}
              role="list"
              aria-label={`${col.name} column, ${col.tasks.length} tasks`}
            >
              <div className="flex items-center gap-2 mb-4 px-1">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", colors.bg)} aria-hidden="true">
                  <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                </div>
                <span className="text-sm font-semibold text-foreground">{col.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto font-medium">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.tasks.map((task) => (
                  <TaskKanbanCard key={task.id} task={task} onDragStart={handleDragStart} onClick={onTaskClick} onDelete={onDelete} />
                ))}
                {col.tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
