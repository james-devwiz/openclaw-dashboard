"use client" // Requires useCallback for drag-and-drop event handlers

import { useCallback } from "react"

import { cn } from "@/lib/utils"

interface PipelineColumnProps<T> {
  id: string
  name: string
  color: string
  items: T[]
  renderItem: (item: T) => React.ReactNode
  onDrop: (itemId: string, targetColumnId: string) => void
  dragOverId: string | null
  onDragOver: (columnId: string) => void
  onDragLeave: () => void
  dataKey?: string
}

export default function PipelineColumn<T extends { id: string }>({
  id, name, color, items, renderItem, onDrop, dragOverId, onDragOver, onDragLeave, dataKey = "itemId",
}: PipelineColumnProps<T>) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    onDragOver(id)
  }, [id, onDragOver])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData(dataKey)
    if (itemId) onDrop(itemId, id)
  }, [id, onDrop, dataKey])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={cn(
        "rounded-3xl p-5 transition-all duration-200 min-h-[200px]",
        "bg-card/20 backdrop-blur-xl border border-border/50",
        dragOverId === id && "border-blue-500/50 bg-blue-500/5"
      )}
      role="list"
      aria-label={`${name} column, ${items.length} items`}
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }} aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto font-medium">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} role="listitem">{renderItem(item)}</div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No items</p>
        )}
      </div>
    </div>
  )
}
