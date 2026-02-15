"use client" // Requires useState, useEffect for fetching entity-scoped activities

import { useState, useEffect } from "react"

import { getEntityActivitiesApi } from "@/services/activity.service"

import type { ActivityItem, ActivityEntityType } from "@/types/activity.types"

export function useEntityActivities(entityType: ActivityEntityType, entityId: string | undefined) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!entityId) { setItems([]); return }
    setLoading(true)
    getEntityActivitiesApi(entityType, entityId)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  return { items, loading }
}
