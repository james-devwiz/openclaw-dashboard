"use client" // Requires useState, useEffect, useCallback for client-side polling

import { useState, useEffect, useCallback } from "react"

import { getHealthApi, getGatewayConfigApi } from "@/services/gateway.service"

import type { HealthStatus, GatewayConfig } from "@/types/index"

export function useGateway() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [config, setConfig] = useState<GatewayConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getHealthApi()
      setHealth(data)
      setError(null)
    } catch (err) {
      console.error("Health check failed:", err)
      setError(err instanceof Error ? err.message : "Health check failed")
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const data = await getGatewayConfigApi()
      setConfig(data)
    } catch (err) {
      console.error("Gateway config fetch failed:", err)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchHealth(), fetchConfig()]).finally(() => setLoading(false))
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [fetchHealth, fetchConfig])

  return { health, config, loading, error, refetch: fetchHealth }
}
