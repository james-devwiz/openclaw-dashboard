"use client" // Requires onClick handlers for file management actions

import { Plus, X, FileText, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import type { ProjectFile } from "@/types/index"

interface KnowledgeBasePanelProps {
  files: ProjectFile[]
  onAddFiles: () => void
  onRemoveFile: (relativePath: string) => void
}

export default function KnowledgeBasePanel({ files, onAddFiles, onRemoveFile }: KnowledgeBasePanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Linked Files</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            File contents are injected into every chat message as context.
          </p>
        </div>
        <Button size="sm" onClick={onAddFiles}>
          <Plus size={14} />
          Add Files
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border">
          <FileText size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No files linked yet</p>
          <p className="text-xs text-muted-foreground">Add workspace files to give the AI project context.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.relativePath}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 group"
            >
              <FileText size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.title || file.relativePath}
                </p>
                <p className="text-xs text-muted-foreground truncate">{file.relativePath}</p>
              </div>
              {file.missing && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle size={12} />
                  Not found
                </span>
              )}
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeTime(file.addedAt)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveFile(file.relativePath)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                aria-label={`Remove ${file.relativePath}`}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
