"use client" // Requires useState, useEffect, useCallback for unread state and 30s polling

import { useState, useEffect, useCallback } from "react"

import { getUnreadCountsApi, markTopicReadApi } from "@/services/chat.service"

export function useChatUnread() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)

  const fetchCounts = useCallback(async () => {
    try {
      const data = await getUnreadCountsApi()
      setCounts(data.counts)
      setTotal(data.total)
    } catch {
      // Fail silently — badge just won't show
    }
  }, [])

  const markRead = useCallback(async (topic: string) => {
    // Optimistic: clear this topic's count immediately
    setCounts((prev) => {
      const next = { ...prev }
      delete next[topic]
      return next
    })
    setTotal((prev) => Math.max(0, prev - (counts[topic] || 0)))

    try {
      await markTopicReadApi(topic)
    } catch {
      // Re-fetch on failure to correct state
      fetchCounts()
    }
  }, [counts, fetchCounts])

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  return { counts, total, markRead, refetch: fetchCounts }
}
