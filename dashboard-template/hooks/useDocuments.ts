"use client" // Requires useState, useEffect, useCallback for document fetching with filters

import { useState, useEffect, useCallback } from "react"

import { getDocumentsApi, deleteDocumentApi } from "@/services/document.service"

import type { Document } from "@/types"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState<string | undefined>()
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async (cat?: string, q?: string) => {
    setLoading(true)
    try {
      const data = await getDocumentsApi({ category: cat, search: q || undefined, limit: 50, offset: 0 })
      setDocuments(data.documents)
      setTotal(data.total)
    } catch (err) {
      console.error("Documents fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments(category, search)
  }, [category, search, fetchDocuments])

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocumentApi(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    setTotal((prev) => prev - 1)
  }, [])

  const refetch = useCallback(() => fetchDocuments(category, search), [category, search, fetchDocuments])

  return { documents, total, category, setCategory, search, setSearch, loading, removeDocument, refetch }
}
