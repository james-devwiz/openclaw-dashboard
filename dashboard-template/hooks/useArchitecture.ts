"use client" // Requires useState, useEffect, useCallback for client-side data fetching and polling

import { useState, useEffect, useCallback } from "react"

import { getArchitectureApi } from "@/services/architecture.service"
import type { ArchitectureData } from "@/types/index"

export function useArchitecture() {
  const [data, setData] = useState<ArchitectureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await getArchitectureApi()
      setData(result)
      setError(null)
    } catch (err) {
      console.error("Architecture fetch failed:", err)
      setError(err instanceof Error ? err.message : "Fetch failed")
    }
  }, [])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
