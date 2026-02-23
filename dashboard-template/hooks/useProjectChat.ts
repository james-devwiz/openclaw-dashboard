"use client" // Requires useState, useCallback, useRef, useEffect for project chat streaming and session state

import { useState, useCallback, useRef, useEffect } from "react"

import { getChatHistoryApi } from "@/services/chat.service"
import {
  getProjectSessionsApi, createProjectSessionApi,
  renameProjectSessionApi, deleteProjectSessionApi,
} from "@/services/project.service"
import {
  buildProjectHistory, buildProjectChatBody,
  fetchProjectChatStream, processSSEStream, parseAttachments,
} from "@/lib/project-chat-history"

import type { ChatMessage, ChatSession, ChatAttachment } from "@/types/index"

export function useProjectChat(projectId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({})
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const loadedSessions = useRef<Set<string>>(new Set())

  const messages = activeSessionId ? messagesBySession[activeSessionId] || [] : []

  // Load sessions on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getProjectSessionsApi(projectId).then(async (list) => {
      if (cancelled) return
      setSessions(list)
      if (list.length > 0) {
        setActiveSessionId(list[0].id)
      } else {
        const session = await createProjectSessionApi(projectId)
        setSessions([session])
        setActiveSessionId(session.id)
      }
      setLoading(false)
    }).catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId])

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) return
    if (loadedSessions.current.has(activeSessionId)) return

    let cancelled = false
    setLoading(true)

    getChatHistoryApi(activeSessionId).then((rows) => {
      if (cancelled) return
      const msgs: ChatMessage[] = rows.map((r) => ({
        id: r.id, role: r.role, content: r.content,
        timestamp: r.createdAt, sessionId: r.sessionId, status: "sent" as const,
        ...(r.attachments ? { attachments: parseAttachments(r.attachments) } : {}),
      }))
      setMessagesBySession((prev) => ({ ...prev, [activeSessionId]: msgs }))
      loadedSessions.current.add(activeSessionId)
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [activeSessionId])

  const sendMessage = useCallback(async (content: string, attachments?: ChatAttachment[]) => {
    if (!activeSessionId) return

    const sid = activeSessionId
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: "user", content,
      timestamp: new Date().toISOString(), sessionId: sid,
      status: "sent", attachments,
    }

    setMessagesBySession((prev) => ({ ...prev, [sid]: [...(prev[sid] || []), userMsg] }))
    setIsStreaming(true)

    const assistantId = `ai-${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId, role: "assistant", content: "",
      timestamp: new Date().toISOString(), sessionId: sid,
      isStreaming: true, status: "sending",
    }

    setMessagesBySession((prev) => ({ ...prev, [sid]: [...(prev[sid] || []), assistantMsg] }))

    try {
      abortRef.current = new AbortController()
      const history = buildProjectHistory(messagesBySession[sid] || [])
      const body = buildProjectChatBody({ message: content, sessionId: sid, history, selectedModel, attachments })
      const reader = await fetchProjectChatStream(projectId, body, abortRef.current.signal)

      await processSSEStream(reader, (snapshot) => {
        setMessagesBySession((prev) => ({
          ...prev,
          [sid]: (prev[sid] || []).map((m) =>
            m.id === assistantId ? { ...m, content: snapshot } : m,
          ),
        }))
      })

      setMessagesBySession((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false, status: "sent" } : m,
        ),
      }))
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error"
      if (error instanceof DOMException && error.name === "AbortError") return

      setMessagesBySession((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((m) =>
          m.id === assistantId
            ? { ...m, content: `Failed to get response: ${msg}`, isStreaming: false, status: "error" as const }
            : m,
        ),
      }))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [activeSessionId, projectId, selectedModel, messagesBySession])

  const clearMessages = useCallback(async () => {
    if (!activeSessionId) return
    setMessagesBySession((prev) => ({ ...prev, [activeSessionId]: [] }))
    loadedSessions.current.delete(activeSessionId)
  }, [activeSessionId])

  const createNewSession = useCallback(async () => {
    const session = await createProjectSessionApi(projectId)
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }))
    loadedSessions.current.add(session.id)
  }, [projectId])

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [])

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    await renameProjectSessionApi(sessionId, title)
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title } : s))
  }, [])

  const removeSession = useCallback(async (sessionId: string) => {
    await deleteProjectSessionApi(projectId, sessionId)
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId)
      if (activeSessionId === sessionId && updated.length > 0) {
        setActiveSessionId(updated[0].id)
      }
      return updated
    })
  }, [projectId, activeSessionId])

  const cleanup = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    messages, isStreaming, loading,
    sendMessage, clearMessages,
    selectedModel, setSelectedModel,
    currentSessionId: activeSessionId,
    sessions, createNewSession, switchSession, renameSession, removeSession,
    cleanup,
  }
}
