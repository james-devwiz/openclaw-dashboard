"use client" // Requires useState, useEffect, useCallback for polling stats and paginated logs

import { useState, useEffect, useCallback } from "react"

import { getMcpStatsApi, getMcpCallLogsApi } from "@/services/mcp.service"
import type { McpObservabilityStats, McpCallLog } from "@/types/mcp.types"

export function useMcpObservability(hours = 24) {
  const [stats, setStats] = useState<McpObservabilityStats | null>(null)
  const [logs, setLogs] = useState<McpCallLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const refreshStats = useCallback(async () => {
    try {
      const data = await getMcpStatsApi(hours)
      setStats(data)
    } catch (err) {
      console.error("MCP stats fetch failed:", err)
    }
  }, [hours])

  const refreshLogs = useCallback(async (offset = 0) => {
    try {
      const data = await getMcpCallLogsApi({ limit: 50, offset })
      if (offset === 0) {
        setLogs(data.logs)
      } else {
        setLogs((prev) => [...prev, ...data.logs])
      }
      setLogsTotal(data.total)
    } catch (err) {
      console.error("MCP logs fetch failed:", err)
    }
  }, [])

  useEffect(() => {
    Promise.all([refreshStats(), refreshLogs()]).finally(() => setLoading(false))
    const interval = setInterval(refreshStats, 60000)
    return () => clearInterval(interval)
  }, [refreshStats, refreshLogs])

  const loadMoreLogs = useCallback(async () => {
    await refreshLogs(logs.length)
  }, [logs.length, refreshLogs])

  const refresh = useCallback(async () => {
    await Promise.all([refreshStats(), refreshLogs()])
  }, [refreshStats, refreshLogs])

  return { stats, logs, logsTotal, loading, loadMoreLogs, refresh }
}
