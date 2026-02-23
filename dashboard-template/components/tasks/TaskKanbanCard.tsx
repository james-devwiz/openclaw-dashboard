"use client" // Requires drag event handlers, interactive click/delete handlers

import { GripVertical, Flag, Calendar, Trash2, Clock, CheckCircle2, Bot, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PRIORITY_COLORS, ASSIGNEE_COLORS } from "@/lib/task-constants"

import type { Task, TaskAssignee } from "@/types/index"

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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Delete "${task.name}"?`)) onDelete(task.id)
                  }}
                  className="h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Delete task"
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
          )}
          {task.assignee && <AssigneeBadge assignee={task.assignee} />}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Flag size={10} className={PRIORITY_COLORS[task.priority]} aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{task.priority}</span>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5">{task.category}</Badge>
            {task.complexity === "Complex" && (
              <Badge variant="outline" className="text-[10px] px-1.5 border-purple-500/30 text-purple-500">Complex</Badge>
            )}
            {task.estimatedMinutes && (
              <span className="text-[10px] text-muted-foreground">
                ~{task.estimatedMinutes >= 60 ? `${Math.round(task.estimatedMinutes / 60)}h` : `${task.estimatedMinutes}m`}
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={10} aria-hidden="true" />
                {new Date(task.dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AssigneeBadge({ assignee }: { assignee: TaskAssignee }) {
  const colors = ASSIGNEE_COLORS[assignee]
  const isAI = assignee === "AI Assistant"
  const Icon = isAI ? Bot : User
  return (
    <div className={cn("flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md border text-[10px] font-medium w-fit", colors.bg, colors.border, colors.text)}>
      <Icon size={10} aria-hidden="true" />
      {isAI ? "AI Assistant" : "User"}
    </div>
  )
}
