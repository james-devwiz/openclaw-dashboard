"use client" // Requires drag event handlers, interactive click/delete handlers

import { GripVertical, Flag, Calendar, Trash2, Clock, CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SITE_CONFIG } from "@/lib/site-config"
import { PRIORITY_COLORS } from "@/lib/task-constants"

import type { Task } from "@/types/index"

interface TaskKanbanCardProps {
  task: Task
  onDragStart: (e: React.DragEvent, task: Task) => void
  onClick: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export default function TaskKanbanCard({ task, onDragStart, onClick, onDelete }: TaskKanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-500/30 transition-all duration-200 group"
      role="listitem"
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-muted-foreground/30 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{task.name}</p>
            <div className="flex items-center gap-1 shrink-0">
              {task.approvalId && (
                task.approvalStatus === "Pending"
                  ? <Clock size={12} className="text-amber-500" aria-label="Approval pending" />
                  : <CheckCircle2 size={12} className="text-emerald-500" aria-label="Approved" />
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Delete "${task.name}"?`)) onDelete(task.id)
                  }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                  aria-label="Delete task"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Flag size={10} className={PRIORITY_COLORS[task.priority]} aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{task.priority}</span>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5">{task.category}</Badge>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={10} aria-hidden="true" />
                {new Date(task.dueDate).toLocaleDateString(SITE_CONFIG.locale, { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
