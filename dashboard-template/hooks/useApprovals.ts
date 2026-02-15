"use client" // Requires useState, useEffect, useCallback for approval state and polling

import { useState, useEffect, useCallback } from "react"

import { getApprovalsApi, respondToApprovalApi, getPendingCountApi } from "@/services/approval.service"

import type { ApprovalItem, ApprovalStatus } from "@/types/index"

export function useApprovals() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await getApprovalsApi()
      setItems(data)
      setError(null)
    } catch (err) {
      console.error("Approvals fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch approvals")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCount = useCallback(async () => {
    const count = await getPendingCountApi()
    setPendingCount(count)
  }, [])

  const respond = useCallback(async (id: string, status: ApprovalStatus, response: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, response } : i)))
    try {
      await respondToApprovalApi(id, status, response)
      fetchCount()
    } catch {
      fetchApprovals()
    }
  }, [fetchApprovals, fetchCount])

  useEffect(() => {
    fetchApprovals()
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchApprovals, fetchCount])

  return { items, pendingCount, loading, error, respond, refetch: fetchApprovals }
}
