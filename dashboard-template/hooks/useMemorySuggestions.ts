"use client" // Requires useState, useEffect, useCallback for suggestion state management

import { useState, useEffect, useCallback } from "react"

import { getMemorySuggestionsApi, respondToSuggestionApi } from "@/services/memory.service"

import type { MemorySuggestion, SuggestionStatus } from "@/types/index"

export function useMemorySuggestions() {
  const [suggestions, setSuggestions] = useState<MemorySuggestion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSuggestions = useCallback(async () => {
    try {
      const data = await getMemorySuggestionsApi("pending")
      setSuggestions(data)
    } catch (err) {
      console.error("Failed to fetch suggestions:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const respond = useCallback(async (
    id: string,
    status: SuggestionStatus,
    extra?: { title?: string; content?: string; targetFile?: string; targetCategory?: string }
  ) => {
    await respondToSuggestionApi(id, status, extra)
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  return { suggestions, loading, respond, refetch: fetchSuggestions }
}
