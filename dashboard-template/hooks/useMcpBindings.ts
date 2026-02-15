"use client" // Requires useState, useEffect, useCallback for data fetching

import { useState, useEffect, useCallback } from "react"

import { getMcpBindingsApi, createMcpBindingApi, updateMcpBindingApi, deleteMcpBindingApi } from "@/services/mcp.service"
import type { McpBinding } from "@/types/mcp.types"

export function useMcpBindings(projectId: string | null) {
  const [bindings, setBindings] = useState<McpBinding[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!projectId) { setBindings([]); return }
    try {
      const data = await getMcpBindingsApi(projectId)
      setBindings(data)
    } catch (err) {
      console.error("MCP bindings fetch failed:", err)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      setLoading(true)
      refresh().finally(() => setLoading(false))
    }
  }, [projectId, refresh])

  const createBinding = useCallback(async (serverId: string, toolId?: string, rateLimit?: number) => {
    if (!projectId) return
    const binding = await createMcpBindingApi({ projectId, serverId, toolId, rateLimit })
    await refresh()
    return binding
  }, [projectId, refresh])

  const updateBinding = useCallback(async (id: string, updates: { enabled?: boolean; rateLimit?: number }) => {
    const binding = await updateMcpBindingApi(id, updates)
    await refresh()
    return binding
  }, [refresh])

  const deleteBinding = useCallback(async (id: string) => {
    await deleteMcpBindingApi(id)
    await refresh()
  }, [refresh])

  return { bindings, loading, createBinding, updateBinding, deleteBinding, refresh }
}
