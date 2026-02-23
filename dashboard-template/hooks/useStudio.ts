"use client" // Requires useState, useEffect, useCallback, useMemo for studio state

import { useState, useEffect, useCallback, useMemo } from "react"

import { getPostsApi, createPostApi, updatePostStageApi, deletePostApi } from "@/services/studio.service"
import { PIPELINE_STAGES, STAGE_COLORS } from "@/lib/studio-constants"

import type { Post, PostStage, PostFormat, StudioColumn, CarouselSlide } from "@/types"

export function useStudio() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getPostsApi()
      setPosts(data)
    } catch (err) {
      console.error("Posts fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addPost = useCallback(async (input: {
    title: string; format?: PostFormat; stage?: PostStage
    caption?: string; hook?: string; cta?: string
    topic?: string; hashtags?: string[]; slides?: CarouselSlide[]
    priority?: string
  }): Promise<Post> => {
    const post = await createPostApi(input)
    setPosts((prev) => [post, ...prev])
    return post
  }, [])

  const movePost = useCallback(async (id: string, stage: PostStage) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
    try {
      await updatePostStageApi(id, stage)
    } catch {
      fetchPosts()
    }
  }, [fetchPosts])

  const removePost = useCallback(async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    try {
      await deletePostApi(id)
    } catch {
      fetchPosts()
    }
  }, [fetchPosts])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const columns: StudioColumn[] = useMemo(
    () => PIPELINE_STAGES.map((stage) => ({
      id: stage,
      name: stage,
      color: STAGE_COLORS[stage],
      items: posts.filter((p) => p.stage === stage),
    })),
    [posts]
  )

  const ideas = useMemo(() => posts.filter((p) => p.stage === "Idea"), [posts])

  return { posts, ideas, columns, loading, addPost, movePost, removePost, refetch: fetchPosts }
}
