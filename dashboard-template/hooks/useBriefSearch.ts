"use client" // Requires useState, useEffect, useCallback, useRef for search state management

import { useState, useEffect, useCallback, useRef } from "react"

import { searchBriefsApi, deleteBriefApi } from "@/services/brief.service"

import type { Brief, BriefKind, BriefSearchParams } from "@/types"

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" })
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" })
}

export function useBriefSearch() {
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [total, setTotal] = useState(0)
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [kind, setKind] = useState<BriefKind | "">("")
  const [briefType, setBriefType] = useState<string>("")
  const [source, setSource] = useState<string>("")
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState(daysAgo(7))
  const [to, setTo] = useState(todayStr())
  const [sortBy, setSortBy] = useState<"createdAt" | "date">("createdAt")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const pageSize = 25

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const fetchResults = useCallback(async () => {
    setLoading(true)
    try {
      const params: BriefSearchParams = {
        from, to, sortBy, sortDir,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }
      if (kind) params.kind = kind
      if (briefType) params.briefType = briefType
      if (source) params.source = source
      if (debouncedSearch) params.search = debouncedSearch

      const data = await searchBriefsApi(params)
      setBriefs(data.briefs)
      setTotal(data.total)
      setTypeCounts(data.typeCounts)
    } catch (err) {
      console.error("Brief search failed:", err)
    } finally {
      setLoading(false)
    }
  }, [from, to, kind, briefType, source, debouncedSearch, sortBy, sortDir, page])

  useEffect(() => { fetchResults() }, [fetchResults])

  // Reset page to 1 when filters change
  useEffect(() => { setPage(1) }, [from, to, kind, briefType, source, debouncedSearch])

  // Clear briefType when kind changes (the selected type may not belong to the new kind)
  useEffect(() => { setBriefType("") }, [kind])

  const toggleSort = useCallback((col: "createdAt" | "date") => {
    if (sortBy === col) setSortDir((d) => d === "DESC" ? "ASC" : "DESC")
    else { setSortBy(col); setSortDir("DESC") }
  }, [sortBy])

  const removeBrief = useCallback(async (id: string) => {
    await deleteBriefApi(id)
    setBriefs((prev) => prev.filter((b) => b.id !== id))
    setTotal((prev) => prev - 1)
  }, [])

  return {
    briefs, total, typeCounts, loading, page, pageSize,
    kind, setKind, briefType, setBriefType, source, setSource, search, setSearch,
    from, setFrom, to, setTo, sortBy, sortDir, toggleSort,
    setPage, removeBrief, refetch: fetchResults,
  }
}
