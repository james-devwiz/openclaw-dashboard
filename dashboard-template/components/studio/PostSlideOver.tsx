"use client" // Requires useState for editing state, usePostComposer for save/generate

import { useState, useEffect } from "react"
import { X, Save, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import ComposerTextFields from "./ComposerTextFields"
import ComposerSlides from "./ComposerSlides"
import ComposerPlatforms from "./ComposerPlatforms"
import ComposerMedia from "./ComposerMedia"
import PublishConfirmModal from "./PublishConfirmModal"
import { usePostComposer } from "@/hooks/usePostComposer"
import { uploadMediaApi, removeMediaApi } from "@/services/studio.service"
import { FORMAT_LABELS } from "@/lib/studio-constants"
import { STAGE_COLORS, STUDIO_STAGES } from "@/lib/studio-constants"

import type { Post, PostMedia, PostStage, CarouselSlide } from "@/types"

interface Props {
  post: Post | null
  onClose: () => void
  onUpdate: (post: Post) => void
  onDelete: (id: string) => void
}

export default function PostSlideOver({ post, onClose, onUpdate, onDelete }: Props) {
  const [local, setLocal] = useState<Partial<Post>>({})
  const [media, setMedia] = useState<PostMedia[]>([])
  const [uploading, setUploading] = useState(false)
  const [publishEntry, setPublishEntry] = useState<string | null>(null)
  const { save, saving, addPlatform, removePlatform, generateField, generating, publish, publishing } = usePostComposer(post, onUpdate)

  useEffect(() => {
    if (post) {
      setLocal({ hook: post.hook, caption: post.caption, cta: post.cta, body: post.body, scriptNotes: post.scriptNotes, topic: post.topic, hashtags: post.hashtags, slides: post.slides, stage: post.stage })
      loadMedia()
    }
  }, [post?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMedia = async () => {
    if (!post) return
    try {
      const { apiFetch } = await import("@/lib/api-client")
      const res = await apiFetch(`/api/studio/posts/${post.id}/media`)
      if (res.ok) { const data = await res.json(); setMedia(data.media || []) }
    } catch { /* ignore */ }
  }

  if (!post) return null

  const handleChange = (field: string, value: string | string[]) => {
    if (field === "hashtags") setLocal((p) => ({ ...p, hashtags: value as string[] }))
    else if (field === "slides") setLocal((p) => ({ ...p, slides: value as unknown as CarouselSlide[] }))
    else setLocal((p) => ({ ...p, [field]: value }))
  }

  const handleSave = () => save(local)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const m = await uploadMediaApi(post.id, file)
      setMedia((prev) => [...prev, m])
    } finally { setUploading(false) }
  }

  const handleRemoveMedia = async (mediaId: string) => {
    await removeMediaApi(post.id, mediaId)
    setMedia((prev) => prev.filter((m) => m.id !== mediaId))
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex" onClick={onClose}>
        <div className="flex-1" />
        <div className="w-full max-w-lg bg-card border-l border-border shadow-2xl h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-card z-10 border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{post.title}</h2>
              <span className="text-xs text-muted-foreground">{FORMAT_LABELS[post.format]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </Button>
              <Button onClick={() => onDelete(post.id)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" aria-label="Delete post">
                <Trash2 size={14} />
              </Button>
              <button onClick={onClose} aria-label="Close"><X size={18} className="text-muted-foreground" /></button>
            </div>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Stage selector */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {STUDIO_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setLocal((p) => ({ ...p, stage: s })); save({ stage: s }) }}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      post.stage === s
                        ? "text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    style={post.stage === s ? { backgroundColor: STAGE_COLORS[s] } : undefined}
                  >{s}</button>
                ))}
              </div>
            </div>

            <ComposerTextFields
              format={post.format}
              hook={local.hook ?? ""} caption={local.caption ?? ""} cta={local.cta ?? ""}
              body={local.body ?? ""} scriptNotes={local.scriptNotes ?? ""}
              topic={local.topic ?? ""} hashtags={local.hashtags ?? []}
              onChange={handleChange}
              onGenerate={(field, inst) => generateField(field, inst)}
              generating={generating}
            />

            {post.format === "carousel" && (
              <ComposerSlides
                slides={local.slides ?? []}
                onChange={(s) => setLocal((p) => ({ ...p, slides: s }))}
                onGenerate={(field, inst) => generateField(field, inst)}
                generating={generating}
              />
            )}

            <ComposerPlatforms platforms={post.platforms} onAdd={addPlatform} onRemove={removePlatform} />

            {/* Publish buttons per platform */}
            {post.platforms.filter((p) => p.platformStatus === "draft").map((p) => (
              <Button
                key={p.id}
                onClick={() => setPublishEntry(p.id)}
                variant="outline"
                className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                Publish to {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
              </Button>
            ))}

            <ComposerMedia media={media} onUpload={handleUpload} onRemove={handleRemoveMedia} uploading={uploading} />
          </div>
        </div>
      </div>

      {publishEntry && (
        <PublishConfirmModal
          post={post}
          platformEntryId={publishEntry}
          publishing={publishing}
          onConfirm={() => publish(publishEntry).then(() => setPublishEntry(null))}
          onClose={() => setPublishEntry(null)}
        />
      )}
    </>
  )
}
