"use client" // Requires useState, useCallback, useRef, useEffect for chat state, streaming, and DB persistence

import { useState, useCallback, useRef, useEffect } from "react"

import { getChatHistoryApi, clearChatHistoryApi } from "@/services/chat.service"
import { useChatSessions } from "@/hooks/useChatSessions"
import { useMessagePolling } from "@/hooks/useMessagePolling"
import { TOPIC_SYSTEM_PROMPTS, RESEARCH_MODE_PROMPTS } from "@/lib/chat-prompts"
import { getAgentSystemPrompts } from "@/lib/architecture-agents"
import type { ResearchMode } from "@/components/chat/ResearchModeButtons"

import type { ChatMessage, ChatTopic, ChatAttachment } from "@/types/index"

type SessionMessages = Record<string, ChatMessage[]>

const PLAN_MODE_PROMPT = `You are in Plan Mode. Before taking any actions or executing tasks:
1. Ask 2-4 clarifying questions about the requirements
2. Present a numbered step-by-step plan with clear deliverables
3. Wait for the user to explicitly approve before proceeding
Never skip straight to execution. Always plan first.`

const MENTION_RE = /@([a-z][a-z0-9-]+)/g

function buildHistory(
  messages: ChatMessage[],
  planMode: boolean,
  topicPrompt?: string,
  latestUserContent?: string,
): { role: string; content: string }[] {
  const history: { role: string; content: string }[] = []
  if (topicPrompt) {
    // Inject active brief context so AI can use :::brief-update markers
    const lastBrief = [...messages].reverse().find(m => m.metadata?.briefId)
    if (lastBrief?.metadata) {
      topicPrompt += `\n\nActive brief in this session: ID="${lastBrief.metadata.briefId}", type="${lastBrief.metadata.briefType}". To update it, use :::brief-update with this ID.`
    }
    history.push({ role: "system", content: topicPrompt })
  }
  if (planMode) {
    history.push({ role: "system", content: PLAN_MODE_PROMPT })
  }
  // Inject agent system prompts for @-mentions in the latest user message
  if (latestUserContent) {
    const agentPrompts = getAgentSystemPrompts()
    const injected = new Set<string>()
    let match: RegExpExecArray | null
    MENTION_RE.lastIndex = 0
    while ((match = MENTION_RE.exec(latestUserContent)) !== null) {
      const agentId = match[1]
      if (!injected.has(agentId) && agentPrompts[agentId]) {
        history.push({ role: "system", content: agentPrompts[agentId] })
        injected.add(agentId)
      }
    }
  }
  const filtered = messages
    .filter((m) => m.status !== "error" && m.content.trim())
    .slice(-200)
  for (const m of filtered) {
    history.push({ role: m.role, content: m.content })
  }
  return history
}

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
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        topic,
        sessionId,
        status: "sent",
        attachments,
      }

      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), userMessage],
      }))
      setIsStreaming(true)

      const assistantId = `ai-${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        topic,
        sessionId,
        isStreaming: true,
        status: "sending",
      }

      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), assistantMessage],
      }))

      try {
        abortRef.current = new AbortController()

        let topicPrompt = TOPIC_SYSTEM_PROMPTS[topic]
        if (researchMode) {
          topicPrompt += "\n\n" + RESEARCH_MODE_PROMPTS[researchMode]
        }
        const history = buildHistory(messagesRef.current, planMode, topicPrompt, content)

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content, topic, sessionId, history,
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
                  [sessionId]: (prev[sessionId] || []).map((m) =>
                    m.id === assistantId ? { ...m, content: snapshot } : m,
                  ),
                }))
              } else if (parsed.meta) {
                const meta = parsed.meta
                setMessagesBySession((prev) => ({
                  ...prev,
                  [sessionId]: (prev[sessionId] || []).map((m) =>
                    m.id === assistantId ? { ...m, metadata: { ...m.metadata, ...meta } } : m,
                  ),
                }))
              }
            } catch {
              // skip malformed
            }
          }
        }

        setMessagesBySession((prev) => ({
          ...prev,
          [sessionId]: (prev[sessionId] || []).map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, status: "sent" }
              : m,
          ),
        }))
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error"
        const isAbort = error instanceof DOMException && error.name === "AbortError"
        if (isAbort) return

        setMessagesBySession((prev) => ({
          ...prev,
          [sessionId]: (prev[sessionId] || []).map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `Failed to get response: ${msg}`,
                  isStreaming: false,
                  status: "error" as const,
                }
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

  const clearMessages = useCallback(async () => {
    if (!currentSessionId) return
    setMessagesBySession((prev) => ({ ...prev, [currentSessionId]: [] }))
    loadedSessions.current.delete(currentSessionId)
    try {
      await clearChatHistoryApi(currentSessionId)
    } catch {
      // Fail silently
    }
  }, [currentSessionId])

  const createNewSession = useCallback(async () => {
    const session = await chatSessions.createNewSession(activeTopic)
    setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }))
    loadedSessions.current.add(session.id)
  }, [activeTopic, chatSessions])

  const switchSession = useCallback((sessionId: string) => {
    chatSessions.switchSession(activeTopic, sessionId)
  }, [activeTopic, chatSessions])

  return {
    messages,
    activeTopic,
    setActiveTopic,
    isStreaming,
    loading,
    sendMessage,
    clearMessages,
    // Model selection
    selectedModel,
    setSelectedModel,
    // Plan mode
    planMode,
    setPlanMode,
    // Research mode
    researchMode,
    setResearchMode,
    // Session management
    currentSessionId,
    sessions: chatSessions.sessions(activeTopic),
    createNewSession,
    switchSession,
    renameSession: chatSessions.renameSession,
    removeSession: chatSessions.removeSession,
    cleanup,
  }
}
