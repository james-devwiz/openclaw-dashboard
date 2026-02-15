"use client" // Requires useState, useEffect, useCallback for paginated heartbeat polling

import { useState, useEffect, useCallback } from "react"

import { getHeartbeatsApi, getHeartbeatStatsApi } from "@/services/heartbeat.service"

import type { HeartbeatEvent, HeartbeatStats } from "@/types"

export function useHeartbeats() {
  const [events, setEvents] = useState<HeartbeatEvent[]>([])
  const [stats, setStats] = useState<HeartbeatStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [evData, statsData] = await Promise.all([
        getHeartbeatsApi(20, 0),
        getHeartbeatStatsApi(),
      ])
      setEvents(evData.events)
      setTotal(evData.total)
      setStats(statsData)
    } catch (err) {
      console.error("Heartbeat fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const loadMore = useCallback(async () => {
    try {
      const data = await getHeartbeatsApi(20, events.length)
      setEvents((prev) => [...prev, ...data.events])
    } catch (err) {
      console.error("Heartbeat load more failed:", err)
    }
  }, [events.length])

  return { events, stats, total, loading, loadMore, refetch: fetchAll }
}
