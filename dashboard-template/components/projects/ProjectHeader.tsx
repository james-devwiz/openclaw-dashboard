"use client" // Requires useState for edit state, onClick for back navigation

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FolderOpen, Pencil, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

interface ProjectHeaderProps {
  project: Project
  onRename: (name: string) => void
}

export default function ProjectHeader({ project, onRename }: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(project.name)
  const gradient = COLOR_MAP[project.color] || COLOR_MAP.blue

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== project.name) {
      onRename(editValue.trim())
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      <Link
        href="/projects"
        className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Back to projects"
      >
        <ArrowLeft size={18} />
      </Link>

      <div className={cn("grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br shadow-sm", gradient)}>
        <FolderOpen size={18} className="text-white" aria-hidden="true" />
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false) }}
            className="text-xl font-bold bg-transparent border-b-2 border-blue-500 text-foreground focus:outline-none"
            autoFocus
          />
          <Button variant="ghost" size="icon" onClick={handleSave} className="text-green-600 hover:text-green-700 size-7" aria-label="Save"><Check size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)} className="size-7" aria-label="Cancel"><X size={16} /></Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setEditValue(project.name); setEditing(true) }}
            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Rename project"
          >
            <Pencil size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
