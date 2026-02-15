"use client" // Requires useState, useEffect, useCallback for comment state management

import { useState, useEffect, useCallback } from "react"

import { getCommentsApi, createCommentApi, deleteCommentApi } from "@/services/comment.service"

import type { Comment } from "@/types/index"

export function useComments(taskId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!taskId) { setComments([]); return }
    setLoading(true)
    try {
      const data = await getCommentsApi(taskId)
      setComments(data)
    } catch (err) {
      console.error("Comments fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  const addComment = useCallback(async (content: string, source: "user" | "openclaw" = "user") => {
    if (!taskId) return
    try {
      const comment = await createCommentApi({ taskId, content, source })
      setComments((prev) => [...prev, comment])
      return comment
    } catch (err) {
      console.error("Comment create failed:", err)
      throw err
    }
  }, [taskId])

  const removeComment = useCallback(async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await deleteCommentApi(commentId)
    } catch {
      fetchComments()
    }
  }, [fetchComments])

  useEffect(() => { fetchComments() }, [fetchComments])

  return { comments, loading, addComment, removeComment, refetch: fetchComments }
}
