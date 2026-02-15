"use client" // Requires useState, useEffect, useCallback for activity polling and filter state

import { useState, useEffect, useCallback } from "react"

import { getActivityApi } from "@/services/activity.service"

import type { ActivityItem, ActivityEntityType } from "@/types/activity.types"

export function useActivity(options?: { entityType?: ActivityEntityType; limit?: number }) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState<ActivityEntityType | undefined>(options?.entityType)
  const [offset, setOffset] = useState(0)
  const limit = options?.limit ?? 50

  const fetchActivity = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    try {
      const data = await getActivityApi({ entityType, limit, offset: currentOffset })
      if (reset || currentOffset === 0) {
        setItems(data.items)
      } else {
        setItems((prev) => [...prev, ...data.items])
      }
      setTotal(data.total)
    } catch (err) {
      console.error("Activity fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [entityType, limit, offset])

  useEffect(() => {
    setOffset(0)
    setLoading(true)
    fetchActivity(true)
  }, [entityType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (offset > 0) fetchActivity()
  }, [offset]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchActivity(true), 30000)
    return () => clearInterval(interval)
  }, [fetchActivity])

  const loadMore = () => setOffset((prev) => prev + limit)
  const refetch = () => { setOffset(0); fetchActivity(true) }

  return { items, loading, total, entityType, setEntityType, refetch, loadMore }
}
