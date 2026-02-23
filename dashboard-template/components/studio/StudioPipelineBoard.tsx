"use client" // Requires drag-and-drop interaction via onClick callbacks

import { cn } from "@/lib/utils"
import StudioPostCard from "./StudioPostCard"
import type { Post, StudioColumn, PostStage } from "@/types"

interface Props {
  columns: StudioColumn[]
  onMove: (id: string, stage: PostStage) => void
  onItemClick: (post: Post) => void
}

export default function StudioPipelineBoard({ columns, onMove, onItemClick }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.id}
          className="min-w-[260px] max-w-[300px] flex-1 rounded-xl bg-muted/50 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const id = e.dataTransfer.getData("text/plain")
            if (id) onMove(id, col.id)
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-sm font-semibold text-foreground">{col.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">{col.items.length}</span>
          </div>

          <div className="space-y-2">
            {col.items.map((post) => (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", post.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <StudioPostCard post={post} onClick={onItemClick} />
              </div>
            ))}

            {col.items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No posts</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
