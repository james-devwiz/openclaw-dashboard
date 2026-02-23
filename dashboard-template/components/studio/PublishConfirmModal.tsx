"use client" // Requires onClick handlers for publish confirmation

import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Post } from "@/types"

interface Props {
  post: Post
  platformEntryId: string
  publishing: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function PublishConfirmModal({ post, platformEntryId, publishing, onConfirm, onClose }: Props) {
  const entry = post.platforms.find((p) => p.id === platformEntryId)
  if (!entry) return null

  const caption = entry.captionOverride || post.caption
  const hashtags = post.hashtags.length ? "\n\n" + post.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ") : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground mb-1">Publish to {entry.platform}</h3>
        <p className="text-xs text-muted-foreground mb-4">This will post immediately to your {entry.platform} account.</p>

        <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4 max-h-60 overflow-y-auto">
          <p className="text-sm text-foreground whitespace-pre-wrap">{caption}{hashtags}</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="ghost">Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={publishing}
            className="bg-green-600 hover:bg-green-700"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {publishing ? "Publishing..." : "Publish Now"}
          </Button>
        </div>
      </div>
    </div>
  )
}
