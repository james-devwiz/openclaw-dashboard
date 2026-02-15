"use client" // Requires useState, useEffect, useCallback for data fetching and polling

import { useState, useEffect, useCallback } from "react"

import {
  getMcpServersApi, createMcpServerApi, updateMcpServerApi,
  deleteMcpServerApi, testMcpServerApi, syncMcpToolsApi,
} from "@/services/mcp.service"
import type { McpServer, CreateMcpServerInput, UpdateMcpServerInput } from "@/types/mcp.types"

export function useMcpServers() {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getMcpServersApi(true)
      setServers(data)
    } catch (err) {
      console.error("MCP servers fetch failed:", err)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const interval = setInterval(refresh, 60000)
    return () => clearInterval(interval)
  }, [refresh])

  const createServer = useCallback(async (input: CreateMcpServerInput) => {
    const server = await createMcpServerApi(input)
    await refresh()
    return server
  }, [refresh])

  const updateServer = useCallback(async (id: string, updates: UpdateMcpServerInput) => {
    const server = await updateMcpServerApi(id, updates)
    await refresh()
    return server
  }, [refresh])

  const deleteServer = useCallback(async (id: string) => {
    await deleteMcpServerApi(id)
    await refresh()
  }, [refresh])

  const testConnection = useCallback(async (id: string) => {
    const result = await testMcpServerApi(id)
    await refresh()
    return result
  }, [refresh])

  const syncTools = useCallback(async (id: string) => {
    const result = await syncMcpToolsApi(id)
    await refresh()
    return result
  }, [refresh])

  return { servers, loading, createServer, updateServer, deleteServer, testConnection, syncTools, refresh }
}
