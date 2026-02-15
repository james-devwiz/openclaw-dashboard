"use client" // Requires useState, useEffect, useCallback, useRef for Cmd+K search and keyboard listener

import { useState, useEffect, useCallback, useRef } from "react"

import { globalSearchApi } from "@/services/search.service"

import type { SearchResult } from "@/types/index"

export function useGlobalSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const data = await globalSearchApi(q)
      setResults(data)
      setLoading(false)
    }, 300)
  }, [])

  const open = useCallback(() => setIsOpen(true), [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery("")
    setResults([])
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === "Escape" && isOpen) {
        close()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, close])

  return { results, isOpen, query, loading, search, open, close }
}
