"use client" // Requires onClick handler for navigation

import Link from "next/link"
import { FolderOpen, MessageSquare, FileText, MoreHorizontal, Trash2, Archive } from "lucide-react"

import { cn, formatRelativeTime } from "@/lib/utils"
import type { Project } from "@/types/index"

const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
  cyan: "from-cyan-500 to-cyan-600",
  pink: "from-pink-500 to-pink-600",
}

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
}

export default function ProjectCard({ project, onDelete, onArchive }: ProjectCardProps) {
  const gradient = COLOR_MAP[project.color] || COLOR_MAP.blue

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-xl border border-border bg-card p-6 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br shadow-sm", gradient)}>
          <FolderOpen size={18} className="text-white" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onArchive && (
            <button
              onClick={(e) => { e.preventDefault(); onArchive(project.id) }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Archive project"
            >
              <Archive size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(project.id) }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              aria-label="Delete project"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-2">
        <span className="flex items-center gap-1">
          <FileText size={12} aria-hidden="true" />
          {project.fileCount || 0} files
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} aria-hidden="true" />
          {project.sessionCount || 0} chats
        </span>
        <span className="ml-auto">{formatRelativeTime(project.updatedAt)}</span>
      </div>
    </Link>
  )
}
