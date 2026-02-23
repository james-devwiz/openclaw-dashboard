"use client" // Requires useState for form fields, useEffect for loading projects

import { useState, useEffect } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ALL_CATEGORIES } from "@/lib/document-constants"
import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "@/lib/architecture-agents"
import { apiFetch } from "@/lib/api-client"

import type { DocumentCategory, DocumentFolder, Project } from "@/types"

type LocationType = "general" | "system" | "project" | "agent"

interface CreateDocumentModalProps {
  onClose: () => void
  onCreate: (input: {
    category: DocumentCategory; title: string; content: string; tags: string
    folder?: DocumentFolder; projectId?: string; agentId?: string
  }) => void
  defaultFolder?: DocumentFolder
  defaultProjectId?: string
  defaultAgentId?: string
}

export default function CreateDocumentModal({ onClose, onCreate, defaultFolder, defaultProjectId, defaultAgentId }: CreateDocumentModalProps) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<DocumentCategory>("Notes")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [locationType, setLocationType] = useState<LocationType>(
    defaultProjectId ? "project" : defaultAgentId ? "agent" : defaultFolder === "system" ? "system" : "general"
  )
  const [projectId, setProjectId] = useState(defaultProjectId || "")
  const [agentId, setAgentId] = useState(defaultAgentId || "")
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    apiFetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects || [])).catch(() => {})
  }, [])

  const agents = [...CONTEXTUAL_AGENTS, ...SUB_AGENTS]

  const handleSubmit = () => {
    if (!title.trim()) return
    onCreate({
      category, title: title.trim(), content, tags,
      folder: locationType === "system" ? "system" : "general",
      projectId: locationType === "project" ? projectId || undefined : undefined,
      agentId: locationType === "agent" ? agentId || undefined : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Create document">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">New Document</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Title" autoFocus
          />
          <select
            value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
            aria-label="Category"
          >
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Location picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(["general", "system", "project", "agent"] as LocationType[]).map((lt) => (
                <button
                  key={lt} onClick={() => setLocationType(lt)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors", locationType === lt ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-accent text-muted-foreground hover:text-foreground")}
                >
                  {lt === "general" ? "General" : lt === "system" ? "System" : lt === "project" ? "Project" : "Agent"}
                </button>
              ))}
            </div>
            {locationType === "project" && (
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground" aria-label="Project">
                <option value="">Select a project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {locationType === "agent" && (
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground" aria-label="Agent">
                <option value="">Select an agent...</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>

          <textarea
            value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Document content (supports Markdown)" rows={6}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Content"
          />
          <input
            type="text" value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Tags"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create
          </Button>
        </div>
      </div>
    </div>
  )
}
