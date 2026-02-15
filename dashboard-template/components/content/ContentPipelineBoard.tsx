"use client" // Requires useState, useCallback for drag-and-drop state management

import { useState, useCallback } from "react"

import PipelineColumn from "@/components/ui/PipelineColumn"
import ContentCard from "./ContentCard"

import type { ContentItem, ContentColumn, ContentStage } from "@/types/index"

interface ContentPipelineBoardProps {
  columns: ContentColumn[]
  onMove: (id: string, stage: ContentStage) => void
  onItemClick: (item: ContentItem) => void
}

export default function ContentPipelineBoard({ columns, onMove, onItemClick }: ContentPipelineBoardProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, item: ContentItem) => {
    e.dataTransfer.setData("itemId", item.id)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDrop = useCallback((itemId: string, targetColumnId: string) => {
    setDragOverId(null)
    onMove(itemId, targetColumnId as ContentStage)
  }, [onMove])

  const handleDragLeave = useCallback(() => setDragOverId(null), [])

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 overflow-auto"
      role="region"
      aria-label="Content pipeline board"
    >
      {columns.map((col) => (
        <PipelineColumn
          key={col.id}
          id={col.id}
          name={col.name}
          color={col.color}
          items={col.items}
          renderItem={(item) => (
            <ContentCard item={item} onDragStart={handleDragStart} onClick={onItemClick} />
          )}
          onDrop={handleDrop}
          dragOverId={dragOverId}
          onDragOver={setDragOverId}
          onDragLeave={handleDragLeave}
        />
      ))}
    </div>
  )
}
