"use client" // Requires useState for tab state, useParams for route param; composes project sub-components

import { useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import ProjectHeader from "@/components/projects/ProjectHeader"
import ProjectTabs, { type ProjectTab } from "@/components/projects/ProjectTabs"
import InstructionsEditor from "@/components/projects/InstructionsEditor"
import KnowledgeBasePanel from "@/components/projects/KnowledgeBasePanel"
import FilePickerDialog from "@/components/projects/FilePickerDialog"
import ProjectChatTab from "@/components/projects/ProjectChatTab"
import { useProjectDetail } from "@/hooks/useProjectDetail"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const { project, files, loading, error, updateProject, addFiles, removeFile } = useProjectDetail(projectId)
  const [activeTab, setActiveTab] = useState<ProjectTab>("chat")
  const [showFilePicker, setShowFilePicker] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">{error || "Project not found"}</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <ProjectHeader
        project={project}
        onRename={(name) => updateProject({ name })}
      />

      <ProjectTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fileCount={files.length}
      />

      {activeTab === "chat" && (
        <ProjectChatTab projectId={projectId} projectName={project.name} />
      )}

      {activeTab === "instructions" && (
        <InstructionsEditor
          instructions={project.instructions || ""}
          onSave={(instructions) => updateProject({ instructions })}
        />
      )}

      {activeTab === "knowledge" && (
        <KnowledgeBasePanel
          files={files}
          onAddFiles={() => setShowFilePicker(true)}
          onRemoveFile={removeFile}
        />
      )}

      {showFilePicker && (
        <FilePickerDialog
          onClose={() => setShowFilePicker(false)}
          onSelect={addFiles}
          existingPaths={files.map((f) => f.relativePath)}
        />
      )}
    </div>
  )
}
