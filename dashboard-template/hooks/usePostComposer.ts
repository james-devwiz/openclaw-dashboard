"use client" // Requires useState, useCallback for composer form state

import { useState, useCallback } from "react"

import { updatePostApi, addPlatformApi, removePlatformApi, generateDraftApi, publishPostApi } from "@/services/studio.service"

import type { Post, PostFormat, PostPlatform, CarouselSlide } from "@/types"

export function usePostComposer(post: Post | null, onUpdate?: (post: Post) => void) {
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const save = useCallback(async (updates: Partial<Post>) => {
    if (!post) return
    setSaving(true)
    try {
      const updated = await updatePostApi(post.id, updates)
      onUpdate?.(updated)
    } finally {
      setSaving(false)
    }
  }, [post, onUpdate])

  const addPlatform = useCallback(async (platform: PostPlatform) => {
    if (!post) return
    await addPlatformApi(post.id, platform)
    const { getPostApi } = await import("@/services/studio.service")
    const updated = await getPostApi(post.id)
    onUpdate?.(updated)
  }, [post, onUpdate])

  const removePlatform = useCallback(async (platformId: string) => {
    if (!post) return
    await removePlatformApi(post.id, platformId)
    const { getPostApi } = await import("@/services/studio.service")
    const updated = await getPostApi(post.id)
    onUpdate?.(updated)
  }, [post, onUpdate])

  const generateField = useCallback(async (field: string, instruction?: string): Promise<{
    draft?: string; drafts?: string[]; slides?: CarouselSlide[]
  }> => {
    setGenerating(field)
    try {
      return await generateDraftApi({ postId: post?.id, field, instruction })
    } finally {
      setGenerating(null)
    }
  }, [post])

  const publish = useCallback(async (platformEntryId: string) => {
    if (!post) return
    setPublishing(true)
    try {
      const result = await publishPostApi(post.id, platformEntryId)
      const { getPostApi } = await import("@/services/studio.service")
      const updated = await getPostApi(post.id)
      onUpdate?.(updated)
      return result
    } finally {
      setPublishing(false)
    }
  }, [post, onUpdate])

  return { save, saving, addPlatform, removePlatform, generateField, generating, publish, publishing }
}
