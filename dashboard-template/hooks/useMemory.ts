"use client" // Requires useState, useEffect, useCallback, useRef for memory browsing and debounced search

import { useState, useEffect, useCallback, useRef } from "react"

import {
  getMemoryItemsApi, getMemoryItemApi, getMemoryCategoryCountsApi,
  updateMemoryItemApi, getMemoryRefsApi,
} from "@/services/memory.service"

import type { MemoryItem, MemoryCategory } from "@/types/index"

export function useMemory() {
  const [items, setItems] = useState<MemoryItem[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [selectedItem, setSelectedItem] = useState<MemoryItem | null>(null)
  const [category, setCategory] = useState<MemoryCategory | undefined>("core")
  const [query, setQuery] = useState("")
  const [refs, setRefs] = useState<Record<string, string[]>>({})
  const [refsLoaded, setRefsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const categoryRef = useRef<MemoryCategory | undefined>("core")
  const queryRef = useRef("")

  const fetchItems = useCallback(async (cat?: MemoryCategory, q?: string) => {
    try {
      const data = await getMemoryItemsApi(cat, q)
      setItems(data)
    } catch (err) {
      console.error("Memory fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshCounts = useCallback(async () => {
    try {
      const counts = await getMemoryCategoryCountsApi()
      setCategoryCounts(counts)
    } catch (err) {
      console.error("Memory counts fetch failed:", err)
    }
  }, [])

  const selectItem = useCallback(async (encodedPath: string) => {
    const item = await getMemoryItemApi(encodedPath)
    setSelectedItem(item)
  }, [])

  const clearSelection = useCallback(() => setSelectedItem(null), [])

  const loadRefs = useCallback(async () => {
    if (refsLoaded) return
    try {
      const data = await getMemoryRefsApi()
      setRefs(data)
      setRefsLoaded(true)
    } catch (err) {
      console.error("Memory refs fetch failed:", err)
    }
  }, [refsLoaded])

  const saveItem = useCallback(async (encodedPath: string, content: string) => {
    const updated = await updateMemoryItemApi(encodedPath, content)
    if (updated) setSelectedItem(updated)
    // Refresh list + counts to reflect changes
    fetchItems(categoryRef.current, queryRef.current)
    getMemoryCategoryCountsApi().then(setCategoryCounts).catch(() => {})
  }, [fetchItems])

  const search = useCallback((q: string) => {
    setQuery(q)
    queryRef.current = q
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(categoryRef.current, q), 300)
  }, [fetchItems])

  const filterCategory = useCallback((cat?: MemoryCategory) => {
    setCategory(cat)
    categoryRef.current = cat
    setLoading(true)
    fetchItems(cat, queryRef.current)
  }, [fetchItems])

  useEffect(() => {
    // Load lightweight counts + core items in parallel
    Promise.all([
      getMemoryCategoryCountsApi().then(setCategoryCounts).catch(() => {}),
      getMemoryItemsApi("core").then(setItems).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  return {
    items, categoryCounts, selectedItem, category, query, loading, refs,
    search, filterCategory, selectItem, clearSelection, saveItem, loadRefs, refreshCounts,
    refetch: () => {
      refreshCounts()
      fetchItems(categoryRef.current, queryRef.current)
    },
  }
}
