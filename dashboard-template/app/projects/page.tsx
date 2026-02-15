"use client" // Requires useProjects hook for project list state, useState for dialog

import { useState } from "react"
import { Plus, Loader2, FolderOpen } from "lucide-react"

import PageHeader from "@/components/layout/PageHeader"
import ProjectCard from "@/components/projects/ProjectCard"
import CreateProjectDialog from "@/components/projects/CreateProjectDialog"
import { useProjects } from "@/hooks/useProjects"

export default function ProjectsPage() {
  const { projects, loading, createProject, deleteProject } = useProjects()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Projects"
        subtitle="Scoped AI workspaces with persistent instructions and knowledge"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            New Project
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={48} className="text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create a project to give your AI persistent instructions and a scoped knowledge base.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectDialog
          onClose={() => setShowCreate(false)}
          onCreate={async (input) => { await createProject(input) }}
        />
      )}
    </div>
  )
}
