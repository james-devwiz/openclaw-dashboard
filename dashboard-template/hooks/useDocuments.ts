"use client" // Requires useState, useEffect, useCallback for document fetching with filters

import { useState, useEffect, useCallback } from "react"

import { getDocumentsApi, createDocumentApi, updateDocumentApi, deleteDocumentApi } from "@/services/document.service"

import type { Document, DocumentCategory } from "@/types"

export const PAGE_SIZE = 20

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState<string | undefined>()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async (cat?: string, q?: string, p = 1) => {
    setLoading(true)
    try {
      const data = await getDocumentsApi({
        category: cat,
        search: q || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setDocuments(data.documents)
      setTotal(data.total)
    } catch (err) {
      console.error("Documents fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchDocuments(category, search, 1)
  }, [category, search, fetchDocuments])

  useEffect(() => {
    fetchDocuments(category, search, page)
  }, [page, category, search, fetchDocuments])

  const createDocument = useCallback(async (input: {
    category?: DocumentCategory; title: string; content?: string; tags?: string
  }) => {
    await createDocumentApi(input)
    setPage(1)
    fetchDocuments(category, search, 1)
  }, [category, search, fetchDocuments])

  const updateDocument = useCallback(async (
    id: string, updates: Partial<Pick<Document, "category" | "title" | "content" | "tags">>
  ) => {
    await updateDocumentApi(id, updates)
    fetchDocuments(category, search, page)
  }, [category, search, page, fetchDocuments])

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocumentApi(id)
    fetchDocuments(category, search, page)
  }, [category, search, page, fetchDocuments])

  const refetch = useCallback(() => fetchDocuments(category, search, page), [category, search, page, fetchDocuments])

  return {
    documents, total, category, setCategory, search, setSearch,
    page, setPage, loading, createDocument, updateDocument, removeDocument, refetch,
  }
}
