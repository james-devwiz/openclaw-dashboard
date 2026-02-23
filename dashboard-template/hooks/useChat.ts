"use client" // Requires useState, useCallback, useRef, useEffect for chat state, streaming, and DB persistence

import { useState, useCallback, useRef, useEffect } from "react"

import { apiFetch } from "@/lib/api-client"
import { getChatHistoryApi } from "@/services/chat.service"
import { useChatSessions } from "@/hooks/useChatSessions"
import { useMessagePolling } from "@/hooks/useMessagePolling"
import {
  parseAttachments, buildHistory, resolveAgent,
  buildTopicPrompt, processSSEStream,
} from "@/lib/chat-history"
import type { SessionMessages } from "@/lib/chat-history"
import type { ResearchMode } from "@/components/chat/ResearchModeButtons"
import type { ChatMessage, ChatTopic, ChatAttachment } from "@/types/index"

export function useChat() {
  const [messagesBySession, setMessagesBySession] = useState<SessionMessages>({})
  const [activeTopic, setActiveTopic] = useState<ChatTopic>("general")
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [planMode, setPlanMode] = useState(false)
  const [researchMode, setResearchMode] = useState<ResearchMode>(null)
  const abortRef = useRef<AbortController | null>(null)
  const loadedSessions = useRef<Set<string>>(new Set())
  const messagesRef = useRef<ChatMessage[]>([])

  const chatSessions = useChatSessions()
  const currentSessionId = chatSessions.activeSessionId(activeTopic)
  const messages = currentSessionId ? messagesBySession[currentSessionId] || [] : []
  messagesRef.current = messages

  // Load sessions when topic changes, auto-create if none exist
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    chatSessions.loadSessions(activeTopic).then(async (list) => {
      if (cancelled) return
      if (list.length === 0) {
        await chatSessions.createNewSession(activeTopic)
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [activeTopic]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when active session changes
  useEffect(() => {
    if (!currentSessionId) return
    if (loadedSessions.current.has(currentSessionId)) return

    let cancelled = false
    setLoading(true)

    getChatHistoryApi(currentSessionId)
      .then((rows) => {
        if (cancelled) return
        const msgs: ChatMessage[] = rows.map((r) => ({
          id: r.id,
          role: r.role,
          content: r.content,
          timestamp: r.createdAt,
          topic: activeTopic,
          sessionId: r.sessionId,
          status: "sent" as const,
          ...(r.attachments ? { attachments: parseAttachments(r.attachments) } : {}),
        }))
        setMessagesBySession((prev) => ({ ...prev, [currentSessionId]: msgs }))
        loadedSessions.current.add(currentSessionId)
      })
      .catch(() => { /* fail silently */ })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [currentSessionId, activeTopic])

  const updateSessionMessages = useCallback((sid: string, msgs: ChatMessage[]) => {
    setMessagesBySession((prev) => ({ ...prev, [sid]: msgs }))
  }, [])

  useMessagePolling(currentSessionId, messages, isStreaming, activeTopic, updateSessionMessages)

  const cleanup = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const sendMessage = useCallback(
    async (content: string, attachments?: ChatAttachment[]) => {
      const topic = activeTopic
      const sessionId = currentSessionId
      if (!sessionId) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`, role: "user", content,
        timestamp: new Date().toISOString(), topic, sessionId,
        status: "sent", attachments,
      }
      setMessagesBySession((prev) => ({
        ...prev, [sessionId]: [...(prev[sessionId] || []), userMessage],
      }))
      setIsStreaming(true)

      const assistantId = `ai-${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantId, role: "assistant", content: "",
        timestamp: new Date().toISOString(), topic, sessionId,
        isStreaming: true, status: "sending",
      }
      setMessagesBySession((prev) => ({
        ...prev, [sessionId]: [...(prev[sessionId] || []), assistantMessage],
      }))

      try {
        abortRef.current = new AbortController()
        const agent = await resolveAgent(content, topic, selectedModel, abortRef.current.signal)
        const topicPrompt = buildTopicPrompt(topic, researchMode)
        const history = buildHistory(messagesRef.current, planMode, topicPrompt, content, agent.agentId)

        const res = await apiFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content, topic, sessionId, history,
            ...(agent.model ? { model: agent.model } : {}),
            ...(agent.agentId ? { agentId: agent.agentId, agentName: agent.agentName } : {}),
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

        const updateMsg = (updater: (m: ChatMessage) => ChatMessage) => {
          setMessagesBySession((prev) => ({
            ...prev,
            [sessionId]: (prev[sessionId] || []).map((m) => m.id === assistantId ? updater(m) : m),
          }))
        }

        await processSSEStream(reader, {
          onContent: (accumulated) => updateMsg((m) => ({ ...m, content: accumulated })),
          onMeta: (meta) => updateMsg((m) => ({ ...m, metadata: { ...m.metadata, ...meta } })),
        })

        updateMsg((m) => ({ ...m, isStreaming: false, status: "sent" }))
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error"
        if (error instanceof DOMException && error.name === "AbortError") return
        setMessagesBySession((prev) => ({
          ...prev,
          [sessionId]: (prev[sessionId] || []).map((m) =>
            m.id === assistantId
              ? { ...m, content: `Failed to get response: ${msg}`, isStreaming: false, status: "error" as const }
              : m,
          ),
        }))
      } finally {
        setIsStreaming(false)
        setResearchMode(null)
        abortRef.current = null
      }
    },
    [activeTopic, currentSessionId, selectedModel, planMode, researchMode],
  )

  const createNewSession = useCallback(async () => {
    const session = await chatSessions.createNewSession(activeTopic)
    setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }))
    loadedSessions.current.add(session.id)
  }, [activeTopic, chatSessions])

  const switchSession = useCallback((sessionId: string) => {
    chatSessions.switchSession(activeTopic, sessionId)
  }, [activeTopic, chatSessions])

  return {
    messages, activeTopic, setActiveTopic, isStreaming, loading, sendMessage,
    selectedModel, setSelectedModel,
    planMode, setPlanMode,
    researchMode, setResearchMode,
    currentSessionId,
    sessions: chatSessions.sessions(activeTopic),
    createNewSession, switchSession,
    renameSession: chatSessions.renameSession,
    removeSession: chatSessions.removeSession,
    cleanup,
  }
}
