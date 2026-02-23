"use client" // Requires useState for expand/collapse of Projects and Agents sections

import { useState } from "react"
import { Inbox, Settings, FolderOpen, Bot, ChevronRight, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

import type { DocumentNavFilter } from "@/hooks/useDocuments"
import type { DocumentFolderCounts } from "@/services/document.service"

interface DocumentFolderNavProps {
  counts: DocumentFolderCounts | null
  activeFilter: DocumentNavFilter
  onSelect: (filter: DocumentNavFilter) => void
  agentNames: Record<string, string>
}

export default function DocumentFolderNav({ counts, activeFilter, onSelect, agentNames }: DocumentFolderNavProps) {
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [agentsOpen, setAgentsOpen] = useState(true)

  const totalCount = counts
    ? counts.folderCounts.general + counts.folderCounts.system
      + counts.projectCounts.reduce((s, p) => s + p.count, 0)
      + counts.agentCounts.reduce((s, a) => s + a.count, 0)
    : 0

  const isActive = (filter: DocumentNavFilter) => {
    if (filter.type !== activeFilter.type) return false
    if (filter.type === "all") return true
    if (filter.type === "folder" && activeFilter.type === "folder") return filter.folder === activeFilter.folder
    if (filter.type === "project" && activeFilter.type === "project") return filter.projectId === activeFilter.projectId
    if (filter.type === "agent" && activeFilter.type === "agent") return filter.agentId === activeFilter.agentId
    return false
  }

  const itemClass = (active: boolean) => cn(
    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
    active
      ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  )

  return (
    <nav className="space-y-1" role="navigation" aria-label="Document folders">
      {/* All Documents */}
      <button onClick={() => onSelect({ type: "all" })} className={itemClass(isActive({ type: "all" }))}>
        <FileText size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate flex-1 text-left">All Documents</span>
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{totalCount}</span>
      </button>

      {/* General */}
      <button onClick={() => onSelect({ type: "folder", folder: "general" })} className={itemClass(isActive({ type: "folder", folder: "general" }))}>
        <Inbox size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate flex-1 text-left">General</span>
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{counts?.folderCounts.general ?? 0}</span>
      </button>

      {/* System */}
      <button onClick={() => onSelect({ type: "folder", folder: "system" })} className={itemClass(isActive({ type: "folder", folder: "system" }))}>
        <Settings size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate flex-1 text-left">System</span>
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{counts?.folderCounts.system ?? 0}</span>
      </button>

      {/* Projects — only if any project has docs */}
      {counts && counts.projectCounts.length > 0 && (
        <>
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            <ChevronRight size={12} className={cn("transition-transform", projectsOpen && "rotate-90")} />
            Projects
          </button>
          {projectsOpen && counts.projectCounts.map((p) => (
            <button key={p.projectId} onClick={() => onSelect({ type: "project", projectId: p.projectId })} className={cn(itemClass(isActive({ type: "project", projectId: p.projectId })), "pl-6")}>
              <FolderOpen size={14} aria-hidden="true" className="shrink-0 text-blue-500" />
              <span className="truncate flex-1 text-left">{p.name}</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{p.count}</span>
            </button>
          ))}
        </>
      )}

      {/* Agents — only if any agent has docs */}
      {counts && counts.agentCounts.length > 0 && (
        <>
          <button
            onClick={() => setAgentsOpen(!agentsOpen)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            <ChevronRight size={12} className={cn("transition-transform", agentsOpen && "rotate-90")} />
            Agents
          </button>
          {agentsOpen && counts.agentCounts.map((a) => (
            <button key={a.agentId} onClick={() => onSelect({ type: "agent", agentId: a.agentId })} className={cn(itemClass(isActive({ type: "agent", agentId: a.agentId })), "pl-6")}>
              <Bot size={14} aria-hidden="true" className="shrink-0 text-violet-500" />
              <span className="truncate flex-1 text-left">{agentNames[a.agentId] || a.agentId}</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{a.count}</span>
            </button>
          ))}
        </>
      )}
    </nav>
  )
}
