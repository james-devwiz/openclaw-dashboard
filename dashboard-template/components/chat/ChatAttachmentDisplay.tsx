"use client" // Requires useState for lightbox toggle

import { useState } from "react"
import { FileText, Image as ImageIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ChatAttachment } from "@/types/index"

interface ChatAttachmentDisplayProps {
  attachments: ChatAttachment[]
  isUser?: boolean
}

const RASTER_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])

export default function ChatAttachmentDisplay({ attachments, isUser }: ChatAttachmentDisplayProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  if (!attachments?.length) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-1.5">
        {attachments.map((att, i) => {
          const isImage = RASTER_TYPES.has(att.type)
          const hasPreview = isImage && att.dataUrl

          if (hasPreview) {
            return (
              <button
                key={i}
                onClick={() => setLightboxUrl(att.dataUrl)}
                className="block rounded-lg overflow-hidden border border-white/20 hover:opacity-80 transition-opacity"
                aria-label={`View ${att.name}`}
              >
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="max-w-[200px] max-h-[150px] object-cover"
                />
              </button>
            )
          }

          const Icon = isImage ? ImageIcon : FileText
          return (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
                isUser
                  ? "bg-blue-500/30 text-blue-100"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon size={12} aria-hidden />
              {att.name}
            </span>
          )
        })}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="Image preview"
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
