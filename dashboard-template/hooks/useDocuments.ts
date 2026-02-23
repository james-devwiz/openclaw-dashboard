"use client" // Requires useState, useEffect, useCallback for document fetching with filters

import { useState, useEffect, useCallback } from "react"

import {
  getDocumentsApi, createDocumentApi, updateDocumentApi, deleteDocumentApi, getDocumentCountsApi,
} from "@/services/document.service"
import type { DocumentFolderCounts } from "@/services/document.service"

import type { Document, DocumentCategory, DocumentFolder } from "@/types"

export const PAGE_SIZE = 20

export type DocumentNavFilter =
  | { type: "all" }
  | { type: "folder"; folder: DocumentFolder }
  | { type: "project"; projectId: string }
  | { type: "agent"; agentId: string }

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState<string | undefined>()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<DocumentNavFilter>({ type: "all" })
  const [counts, setCounts] = useState<DocumentFolderCounts | null>(null)

  const fetchCounts = useCallback(async () => {
    try {
      setCounts(await getDocumentCountsApi())
    } catch (err) {
      console.error("Document counts fetch failed:", err)
    }
  }, [])

  const fetchDocuments = useCallback(async (
    cat?: string, q?: string, p = 1, filter?: DocumentNavFilter
  ) => {
    setLoading(true)
    try {
      const f = filter || activeFilter
      const data = await getDocumentsApi({
        category: cat,
        search: q || undefined,
        folder: f.type === "folder" ? f.folder : undefined,
        projectId: f.type === "project" ? f.projectId : undefined,
        agentId: f.type === "agent" ? f.agentId : undefined,
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
  }, [activeFilter])

  // Fetch counts on mount
  useEffect(() => { fetchCounts() }, [fetchCounts])

  // Reset page + refetch when category, search, or nav filter changes
  useEffect(() => {
    setPage(1)
    fetchDocuments(category, search, 1, activeFilter)
  }, [category, search, activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch when page changes (but not on initial mount handled above)
  useEffect(() => {
    if (page > 1) fetchDocuments(category, search, page, activeFilter)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const createDocument = useCallback(async (input: {
    category?: DocumentCategory; title: string; content?: string; tags?: string
    folder?: DocumentFolder; projectId?: string; agentId?: string
  }) => {
    await createDocumentApi(input)
    setPage(1)
    fetchDocuments(category, search, 1, activeFilter)
    fetchCounts()
  }, [category, search, activeFilter, fetchDocuments, fetchCounts])

  const updateDocument = useCallback(async (
    id: string,
    updates: Partial<Pick<Document, "category" | "title" | "content" | "tags" | "folder" | "projectId" | "agentId">>
  ) => {
    await updateDocumentApi(id, updates)
    fetchDocuments(category, search, page, activeFilter)
    fetchCounts()
  }, [category, search, page, activeFilter, fetchDocuments, fetchCounts])

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocumentApi(id)
    fetchDocuments(category, search, page, activeFilter)
    fetchCounts()
  }, [category, search, page, activeFilter, fetchDocuments, fetchCounts])

  const refetch = useCallback(() => {
    fetchDocuments(category, search, page, activeFilter)
    fetchCounts()
  }, [category, search, page, activeFilter, fetchDocuments, fetchCounts])

  return {
    documents, total, category, setCategory, search, setSearch,
    page, setPage, loading, createDocument, updateDocument, removeDocument, refetch,
    activeFilter, setActiveFilter, counts,
  }
}
