"use client" // Requires useState, useCallback, useRef, useEffect for project chat streaming and session state

import { useState, useCallback, useRef, useEffect } from "react"

import { getChatHistoryApi } from "@/services/chat.service"
import {
  getProjectSessionsApi, createProjectSessionApi,
  renameProjectSessionApi, deleteProjectSessionApi,
} from "@/services/project.service"

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

      // No system prompt — server injects project context
      const history = (messagesBySession[sid] || [])
        .filter((m) => m.status !== "error" && m.content.trim())
        .slice(-200)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content, sessionId: sid, history,
          ...(selectedModel ? { model: selectedModel } : {}),
          ...(attachments?.length ? { attachments: attachments.map((a) => ({ name: a.name, type: a.type, dataUrl: a.dataUrl })) } : {}),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              accumulated += parsed.content
              const snapshot = accumulated
              setMessagesBySession((prev) => ({
                ...prev,
                [sid]: (prev[sid] || []).map((m) =>
                  m.id === assistantId ? { ...m, content: snapshot } : m,
                ),
              }))
            }
          } catch { /* skip malformed */ }
        }
      }

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
