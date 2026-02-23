"use client" // Requires useState, useCallback, useRef, useEffect for lead chat streaming and session state

import { useState, useCallback, useRef, useEffect } from "react"

import { apiFetch } from "@/lib/api-client"
import { getChatHistoryApi } from "@/services/chat.service"
import {
  getProjectSessionsApi, createProjectSessionApi,
  renameProjectSessionApi, deleteProjectSessionApi,
} from "@/services/project.service"

import type { ChatMessage, ChatSession } from "@/types/index"

export function useLeadChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({})
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const loadedSessions = useRef<Set<string>>(new Set())

  const messages = activeSessionId ? messagesBySession[activeSessionId] || [] : []

  // Load sessions — use "leads" as topic in chat_sessions
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    apiFetch("/api/chat/sessions?topic=leads").then(async (res) => {
      if (cancelled || !res.ok) { setLoading(false); return }
      const data = await res.json()
      const list = data.sessions || []
      setSessions(list)
      if (list.length > 0) {
        setActiveSessionId(list[0].id)
      } else {
        // Create first session
        const res2 = await apiFetch("/api/chat/sessions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: "leads", title: "Lead discussion" }),
        })
        if (res2.ok) {
          const { session } = await res2.json()
          setSessions([session])
          setActiveSessionId(session.id)
        }
      }
      setLoading(false)
    }).catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId || loadedSessions.current.has(activeSessionId)) return
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

  const sendMessage = useCallback(async (content: string) => {
    if (!activeSessionId) return

    const sid = activeSessionId
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: "user", content,
      timestamp: new Date().toISOString(), sessionId: sid, status: "sent",
    }

    setMessagesBySession((prev) => ({ ...prev, [sid]: [...(prev[sid] || []), userMsg] }))
    setIsStreaming(true)

    const assistantId = `ai-${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId, role: "assistant", content: "",
      timestamp: new Date().toISOString(), sessionId: sid, isStreaming: true, status: "sending",
    }
    setMessagesBySession((prev) => ({ ...prev, [sid]: [...(prev[sid] || []), assistantMsg] }))

    try {
      abortRef.current = new AbortController()
      const history = (messagesBySession[sid] || [])
        .filter((m) => m.status !== "error" && m.content.trim())
        .slice(-200)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await apiFetch("/api/leads/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content, sessionId: sid, history,
          ...(selectedModel ? { model: selectedModel } : {}),
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
                ...prev, [sid]: (prev[sid] || []).map((m) =>
                  m.id === assistantId ? { ...m, content: snapshot } : m),
              }))
            }
          } catch { /* skip malformed */ }
        }
      }

      setMessagesBySession((prev) => ({
        ...prev, [sid]: (prev[sid] || []).map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false, status: "sent" } : m),
      }))
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      const msg = error instanceof Error ? error.message : "Unknown error"
      setMessagesBySession((prev) => ({
        ...prev, [sid]: (prev[sid] || []).map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${msg}`, isStreaming: false, status: "error" as const } : m),
      }))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [activeSessionId, selectedModel, messagesBySession])

  const createNewSession = useCallback(async () => {
    const res = await apiFetch("/api/chat/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "leads", title: "Lead discussion" }),
    })
    if (res.ok) {
      const { session } = await res.json()
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }))
      loadedSessions.current.add(session.id)
    }
  }, [])

  const switchSession = useCallback((sessionId: string) => setActiveSessionId(sessionId), [])

  const cleanup = useCallback(() => { abortRef.current?.abort() }, [])

  return {
    messages, isStreaming, loading,
    sendMessage, selectedModel, setSelectedModel,
    currentSessionId: activeSessionId,
    sessions, createNewSession, switchSession, cleanup,
  }
}
