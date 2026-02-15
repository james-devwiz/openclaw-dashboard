"use client" // Requires useState, useEffect, useCallback, useMemo for content pipeline state

import { useState, useEffect, useCallback, useMemo } from "react"

import { getContentApi, createContentApi, updateContentStageApi, updateContentApi } from "@/services/content.service"

import type { ContentItem, ContentColumn, ContentStage } from "@/types/index"

const STAGES: { id: ContentStage; name: string; color: string }[] = [
  { id: "Idea", name: "Idea", color: "#8b5cf6" },
  { id: "Research", name: "Research", color: "#3b82f6" },
  { id: "Draft", name: "Draft", color: "#f59e0b" },
  { id: "Review", name: "Review", color: "#f97316" },
  { id: "Published", name: "Published", color: "#10b981" },
  { id: "Filed", name: "Filed", color: "#6b7280" },
]

export function useContent() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    try {
      const data = await getContentApi()
      setItems(data)
      setError(null)
    } catch (err) {
      console.error("Content fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch content")
    } finally {
      setLoading(false)
    }
  }, [])

  const addContent = useCallback(async (input: {
    title: string
    contentType?: string
    stage?: string
    goalId?: string
    topic?: string
    platform?: string
    scheduledDate?: string
    priority?: string
    source?: string
  }) => {
    const item = await createContentApi(input)
    setItems((prev) => [item, ...prev])
    return item
  }, [])

  const moveContent = useCallback(async (id: string, stage: ContentStage) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage } : i)))
    try {
      await updateContentStageApi(id, stage)
    } catch {
      fetchContent()
    }
  }, [fetchContent])

  const editContent = useCallback(async (id: string, updates: Partial<ContentItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    try {
      await updateContentApi(id, updates)
    } catch {
      fetchContent()
    }
  }, [fetchContent])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const columns: ContentColumn[] = useMemo(
    () => STAGES.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      items: items.filter((i) => i.stage === s.id),
    })),
    [items]
  )

  return { items, columns, loading, error, addContent, moveContent, editContent, refetch: fetchContent }
}
