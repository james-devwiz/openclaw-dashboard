"use client" // Requires useState for form field state management, useEffect for loading projects

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ALL_CATEGORIES } from "@/lib/document-constants"
import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "@/lib/architecture-agents"
import { apiFetch } from "@/lib/api-client"

import type { Document, DocumentCategory, DocumentFolder, Project } from "@/types"

type LocationType = "general" | "system" | "project" | "agent"

interface DocumentEditFormProps {
  doc: Document
  onSave: (updates: Partial<Pick<Document, "category" | "title" | "content" | "tags" | "folder" | "projectId" | "agentId">>) => void
  onCancel: () => void
}

export default function DocumentEditForm({ doc, onSave, onCancel }: DocumentEditFormProps) {
  const [title, setTitle] = useState(doc.title)
  const [category, setCategory] = useState<DocumentCategory>(doc.category)
  const [content, setContent] = useState(doc.content)
  const [tags, setTags] = useState(doc.tags)
  const [locationType, setLocationType] = useState<LocationType>(
    doc.projectId ? "project" : doc.agentId ? "agent" : doc.folder === "system" ? "system" : "general"
  )
  const [projectId, setProjectId] = useState(doc.projectId || "")
  const [agentId, setAgentId] = useState(doc.agentId || "")
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    apiFetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects || [])).catch(() => {})
  }, [])

  const agents = [...CONTEXTUAL_AGENTS, ...SUB_AGENTS]

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(), category, content, tags,
      folder: locationType === "system" ? "system" : "general",
      projectId: locationType === "project" ? projectId || undefined : undefined,
      agentId: locationType === "agent" ? agentId || undefined : undefined,
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Title" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground" aria-label="Category">
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(["general", "system", "project", "agent"] as LocationType[]).map((lt) => (
            <button key={lt} onClick={() => setLocationType(lt)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors", locationType === lt ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-accent text-muted-foreground hover:text-foreground")}>
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
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Content (Markdown)</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Content" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma-separated)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Tags" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!title.trim()}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
