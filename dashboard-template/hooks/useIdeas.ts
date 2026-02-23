"use client" // Requires useState, useEffect, useCallback, useRef for ideas table state

import { useState, useEffect, useCallback, useRef } from "react"

import { getIdeasApi, promoteToPipelineApi } from "@/services/content.service"
import type { ContentItem, ContentFormat } from "@/types"

export function useIdeas() {
  const [ideas, setIdeas] = useState<ContentItem[]>([])
  const [total, setTotal] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const pageSize = 25

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getIdeasApi({
        category: category || undefined,
        search: debouncedSearch || undefined,
        sortBy,
        sortDir,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setIdeas(data.ideas)
      setTotal(data.total)
      setCategoryCounts(data.categoryCounts)
    } catch (err) {
      console.error("Ideas fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [category, debouncedSearch, sortBy, sortDir, page])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])
  useEffect(() => { setPage(1) }, [category, debouncedSearch])

  const toggleSort = useCallback((col: string) => {
    if (sortBy === col) setSortDir((d) => d === "DESC" ? "ASC" : "DESC")
    else { setSortBy(col); setSortDir("DESC") }
  }, [sortBy])

  const promoteToPipeline = useCallback(async (contentId: string, formats: ContentFormat[], contentType: string) => {
    const result = await promoteToPipelineApi(contentId, { formats, contentType })
    await fetchIdeas()
    return result
  }, [fetchIdeas])

  return {
    ideas, total, categoryCounts, loading, page, pageSize,
    category, setCategory, search, setSearch,
    sortBy, sortDir, toggleSort, setPage,
    promoteToPipeline, refetch: fetchIdeas,
  }
}
