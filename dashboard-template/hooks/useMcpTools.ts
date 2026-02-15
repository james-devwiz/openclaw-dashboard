"use client" // Requires useState, useEffect, useCallback for data fetching

import { useState, useEffect, useCallback } from "react"

import { getMcpToolsApi, updateMcpToolApi, callMcpToolApi } from "@/services/mcp.service"
import type { McpTool } from "@/types/mcp.types"

export function useMcpTools(serverId?: string) {
  const [tools, setTools] = useState<McpTool[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (search?: string) => {
    try {
      const data = await getMcpToolsApi(serverId, search)
      setTools(data)
    } catch (err) {
      console.error("MCP tools fetch failed:", err)
    }
  }, [serverId])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const updateTool = useCallback(async (id: string, updates: { tags?: string[]; enabled?: boolean }) => {
    const tool = await updateMcpToolApi(id, updates)
    await refresh()
    return tool
  }, [refresh])

  const callTool = useCallback(async (id: string, params: Record<string, unknown>) => {
    return callMcpToolApi(id, params)
  }, [])

  return { tools, loading, updateTool, callTool, refresh }
}
