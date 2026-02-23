"use client" // Requires useState, useEffect, useCallback for client-side data fetching and polling

import { useState, useEffect, useCallback, useRef } from "react"

import { getArchitectureApi } from "@/services/architecture.service"
import type { ArchitectureData } from "@/types/index"

export function useArchitecture() {
  const [data, setData] = useState<ArchitectureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await getArchitectureApi()
      if (isMounted.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      console.error("Architecture fetch failed:", err)
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Fetch failed")
      }
    }
  }, [])

  const refetch = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    if (isMounted.current) setRefreshing(false)
  }, [fetchData])

  useEffect(() => {
    isMounted.current = true
    fetchData().finally(() => setLoading(false))
    const interval = setInterval(fetchData, 60000)
    return () => { isMounted.current = false; clearInterval(interval) }
  }, [fetchData])

  return { data, loading, refreshing, error, refetch }
}
