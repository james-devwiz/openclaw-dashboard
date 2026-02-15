"use client" // Manages chat session CRUD state per topic

import { useState, useCallback, useRef } from "react"

import {
  getSessionsApi, createSessionApi, renameSessionApi, deleteSessionApi,
} from "@/services/chat.service"

import type { ChatTopic, ChatSession } from "@/types/index"

type TopicSessions = Partial<Record<ChatTopic, ChatSession[]>>
type ActiveSessions = Partial<Record<ChatTopic, string>>

export function useChatSessions() {
  const [sessionsByTopic, setSessionsByTopic] = useState<TopicSessions>({})
  const [activeSessionIds, setActiveSessionIds] = useState<ActiveSessions>({})
  const loadedTopics = useRef<Set<string>>(new Set())

  const sessions = useCallback(
    (topic: ChatTopic) => sessionsByTopic[topic] || [],
    [sessionsByTopic],
  )

  const activeSessionId = useCallback(
    (topic: ChatTopic) => activeSessionIds[topic] || null,
    [activeSessionIds],
  )

  const loadSessions = useCallback(async (topic: ChatTopic) => {
    if (loadedTopics.current.has(topic)) return sessionsByTopic[topic] || []
    try {
      const list = await getSessionsApi(topic)
      setSessionsByTopic((prev) => ({ ...prev, [topic]: list }))
      loadedTopics.current.add(topic)
      // Auto-select most recent
      if (list.length > 0 && !activeSessionIds[topic]) {
        setActiveSessionIds((prev) => ({ ...prev, [topic]: list[0].id }))
      }
      return list
    } catch {
      return []
    }
  }, [sessionsByTopic, activeSessionIds])

  const createNewSession = useCallback(async (topic: ChatTopic) => {
    const session = await createSessionApi(topic)
    setSessionsByTopic((prev) => ({
      ...prev,
      [topic]: [session, ...(prev[topic] || [])],
    }))
    setActiveSessionIds((prev) => ({ ...prev, [topic]: session.id }))
    return session
  }, [])

  const switchSession = useCallback((topic: ChatTopic, sessionId: string) => {
    setActiveSessionIds((prev) => ({ ...prev, [topic]: sessionId }))
  }, [])

  const renameSession = useCallback(async (sessionId: string, title: string, topic: ChatTopic) => {
    await renameSessionApi(sessionId, title)
    setSessionsByTopic((prev) => ({
      ...prev,
      [topic]: (prev[topic] || []).map((s) =>
        s.id === sessionId ? { ...s, title } : s,
      ),
    }))
  }, [])

  const removeSession = useCallback(async (sessionId: string, topic: ChatTopic) => {
    await deleteSessionApi(sessionId)
    setSessionsByTopic((prev) => {
      const updated = (prev[topic] || []).filter((s) => s.id !== sessionId)
      return { ...prev, [topic]: updated }
    })
    // If deleted the active session, switch to the most recent remaining
    setActiveSessionIds((prev) => {
      if (prev[topic] !== sessionId) return prev
      const remaining = (sessionsByTopic[topic] || []).filter((s) => s.id !== sessionId)
      return { ...prev, [topic]: remaining[0]?.id }
    })
  }, [sessionsByTopic])

  return {
    sessions,
    activeSessionId,
    loadSessions,
    createNewSession,
    switchSession,
    renameSession,
    removeSession,
    setActiveSessionIds,
  }
}
