"use client" // Requires useRef, onChange for file upload interaction

import { useRef } from "react"
import { Upload, Trash2, Image, Film, FileText as DocIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PostMedia } from "@/types"

const TYPE_ICONS = { image: Image, video: Film, document: DocIcon }

interface Props {
  media: PostMedia[]
  onUpload: (file: File) => void
  onRemove: (mediaId: string) => void
  uploading?: boolean
}

export default function ComposerMedia({ media, onUpload, onRemove, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      <label className="text-xs font-medium text-foreground mb-2 block">Media</label>

      {media.length > 0 && (
        <div className="space-y-2 mb-3">
          {media.map((m) => {
            const Icon = TYPE_ICONS[m.mediaType]
            return (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                <Icon size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-xs text-foreground flex-1 truncate">{m.filename}</span>
                <span className="text-[10px] text-muted-foreground">{(m.fileSize / 1024).toFixed(0)} KB</span>
                <button onClick={() => onRemove(m.id)} className="text-muted-foreground hover:text-red-500" aria-label="Remove media">
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*,video/*,.pdf" onChange={handleChange} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        aria-label="Upload media"
      >
        <Upload size={14} />
        {uploading ? "Uploading..." : "Upload File"}
      </button>
    </div>
  )
}
