"use client" // Requires useState, useEffect, useCallback for lead comment state management

import { useState, useEffect, useCallback } from "react"

import { getLeadCommentsApi, createLeadCommentApi, deleteLeadCommentApi } from "@/services/lead.service"

import type { LeadComment } from "@/types/index"

export function useLeadComments(leadId: string | null) {
  const [comments, setComments] = useState<LeadComment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!leadId) { setComments([]); return }
    setLoading(true)
    try {
      const data = await getLeadCommentsApi(leadId)
      setComments(data)
    } catch (err) {
      console.error("Lead comments fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  const addComment = useCallback(async (content: string, source: "user" | "openclaw" = "user") => {
    if (!leadId) return
    try {
      const comment = await createLeadCommentApi({ leadId, content, source })
      setComments((prev) => [...prev, comment])
      return comment
    } catch (err) {
      console.error("Lead comment create failed:", err)
      throw err
    }
  }, [leadId])

  const removeComment = useCallback(async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await deleteLeadCommentApi(commentId)
    } catch {
      fetchComments()
    }
  }, [fetchComments])

  useEffect(() => { fetchComments() }, [fetchComments])

  return { comments, loading, addComment, removeComment, refetch: fetchComments }
}
