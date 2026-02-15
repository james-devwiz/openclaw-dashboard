"use client" // Requires useState for expand/collapse state

import { useState } from "react"

import { ChevronDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import ApprovalResponseInput from "./ApprovalResponseInput"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"

import type { ApprovalItem, ApprovalStatus } from "@/types/index"

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "border-l-red-500",
  High: "border-l-orange-500",
  Medium: "border-l-blue-500",
  Low: "border-l-gray-400",
}

const STATUS_VARIANTS: Record<string, "success" | "error" | "warning" | "secondary"> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
  Deferred: "secondary",
  Responded: "success",
}

interface ApprovalCardProps {
  item: ApprovalItem
  onRespond: (id: string, status: ApprovalStatus, response: string) => void
}

export default function ApprovalCard({ item, onRespond }: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isPending = item.status === "Pending"

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm border-l-4 transition-all",
        PRIORITY_COLORS[item.priority] || "border-l-gray-400",
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center justify-between"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={STATUS_VARIANTS[item.status] || "secondary"} className="text-[10px]">
              {item.status}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
            <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(item.createdAt)}</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
          {item.requestedBy !== "Manual" && (
            <p className="text-xs text-muted-foreground mt-0.5">Requested by {item.requestedBy}</p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn("text-muted-foreground transition-transform ml-2 shrink-0", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {item.context && (
            <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
              {item.context}
            </div>
          )}

          {item.response && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {item.status === "Rejected" ? "Rejection reason" : "Response"}
              </p>
              <div className={cn(
                "text-sm text-foreground rounded-lg p-3",
                item.status === "Rejected"
                  ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30"
                  : "bg-emerald-50 dark:bg-emerald-900/10"
              )}>
                {item.response}
              </div>
            </div>
          )}

          {item.relatedTaskId && item.relatedTaskName && (
            <div className="text-xs text-muted-foreground">
              Linked task: <span className="font-medium text-foreground">{item.relatedTaskName}</span>
            </div>
          )}

          {isPending && (
            <ApprovalResponseInput onRespond={(status, response) => onRespond(item.id, status, response)} />
          )}
        </div>
      )}
    </div>
  )
}
