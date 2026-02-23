"use client" // Requires useState for collapse state, useEffect for data fetching

import { useState, useEffect } from "react"

import { Link2, ChevronDown, Target, ShieldCheck, ListChecks, FileText, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { Task } from "@/types/index"
import type { ApprovalStatus } from "@/types/approval.types"

interface SiblingTask { id: string; name: string; status: string }

interface RelationsData {
  goalName?: string
  goalStatus?: string
  approvalTitle?: string
  approvalStatus?: ApprovalStatus
  siblings: SiblingTask[]
  contentCount: number
}

interface TaskRelationsSectionProps {
  taskId: string
  goalId: string
  approvalId?: string
  onTaskNavigate?: (task: Task) => void
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "text-amber-500",
  Approved: "text-emerald-500",
  Rejected: "text-red-500",
  Deferred: "text-muted-foreground",
  Responded: "text-blue-500",
}

export default function TaskRelationsSection({ taskId, goalId, approvalId, onTaskNavigate }: TaskRelationsSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [data, setData] = useState<RelationsData | null>(null)
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    async function fetchRelations() {
      try {
        const [goalsRes, tasksRes, approvalRes, postsRes] = await Promise.all([
          fetch(`/api/goals`),
          fetch(`/api/tasks?goalId=${encodeURIComponent(goalId)}`),
          approvalId ? fetch(`/api/approvals?taskId=${encodeURIComponent(taskId)}`) : null,
          fetch(`/api/studio/posts`),
        ])
        const goalsData = goalsRes.ok ? await goalsRes.json() : { goals: [] }
        const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] }
        const approvalData = approvalRes?.ok ? await approvalRes.json() : { item: null }
        const postsData = postsRes.ok ? await postsRes.json() : { posts: [] }

        const goal = goalsData.goals?.find((g: { id: string }) => g.id === goalId)
        const tasks = tasksData.tasks || []
        const siblings = tasks.filter((t: Task) => t.id !== taskId)
        const linkedContent = (postsData.posts || []).filter((p: { goalId: string }) => p.goalId === goalId)

        setAllTasks(tasks)
        setData({
          goalName: goal?.name,
          goalStatus: goal?.status,
          approvalTitle: approvalData.item?.title,
          approvalStatus: approvalData.item?.status,
          siblings: siblings.slice(0, 5).map((t: Task) => ({ id: t.id, name: t.name, status: t.status })),
          contentCount: linkedContent.length,
        })
      } catch {
        /* silently fail — relations are supplementary */
      }
    }
    fetchRelations()
  }, [taskId, goalId, approvalId])

  const handleSiblingClick = (siblingId: string) => {
    if (!onTaskNavigate) return
    const task = allTasks.find((t) => t.id === siblingId)
    if (task) onTaskNavigate(task)
  }

  if (!data) return null

  return (
    <div>
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 mb-3 w-full text-left">
        <Link2 size={14} className="text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">Relations</h3>
        <ChevronDown size={14} className={cn("text-muted-foreground ml-auto transition-transform", collapsed && "-rotate-90")} aria-hidden="true" />
      </button>

      {!collapsed && (
        <div className="space-y-2 text-sm">
          {data.goalName && (
            <div className="flex items-center gap-2">
              <Target size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">Goal:</span>
              <span className="font-medium text-foreground">{data.goalName}</span>
              {data.goalStatus && <Badge variant="secondary" className="text-[10px]">{data.goalStatus}</Badge>}
            </div>
          )}

          {data.approvalTitle && (
            <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">Approval:</span>
              <span className="font-medium text-foreground truncate">{data.approvalTitle}</span>
              {data.approvalStatus && (
                <span className={cn("text-xs font-medium", STATUS_COLORS[data.approvalStatus])}>
                  {data.approvalStatus}
                </span>
              )}
            </div>
          )}

          {data.siblings.length > 0 && (
            <div className="flex items-start gap-2">
              <ListChecks size={12} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground">Sibling tasks </span>
                <span className="text-xs text-muted-foreground">({data.siblings.length} in same goal)</span>
                <ul className="mt-1 space-y-1">
                  {data.siblings.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => handleSiblingClick(s.id)}
                        className="group/sibling flex items-center gap-1.5 text-left text-xs hover:text-blue-500 transition-colors w-full"
                        aria-label={`Navigate to task: ${s.name}`}
                      >
                        <ArrowRight size={10} className="text-muted-foreground group-hover/sibling:text-blue-500 shrink-0" aria-hidden="true" />
                        <span className="truncate">{s.name}</span>
                        <Badge variant="secondary" className="text-[9px] shrink-0 ml-auto">{s.status}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {data.contentCount > 0 && (
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">Content:</span>
              <span className="text-xs text-muted-foreground">{data.contentCount} items linked to goal</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
