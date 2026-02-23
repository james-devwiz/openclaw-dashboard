"use client" // Requires useState, useEffect, useCallback for LinkedIn thread/action state management

import { useState, useEffect, useCallback } from "react"

import { getThreadsApi } from "@/services/linkedin.service"
import {
  loadMessages, markThreadRead, patchThread, sendLinkedInMessage,
  classifyAll, classifyByIds, changeClassification as classifyThread,
  scoreThread as scoreThreadAction, enrichThread as enrichThreadAction,
  generateDraft as generateDraftAction, fetchPosts as fetchPostsAction,
  syncLinkedIn as syncLinkedInAction, loadActions, executeAction as execAction,
} from "@/lib/linkedin-actions"

import type { LinkedInThread, LinkedInMessage, LinkedInAction } from "@/types"

export const PAGE_SIZE = 30

export function useLinkedIn() {
  const [threads, setThreads] = useState<LinkedInThread[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState("unread")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [classifying, setClassifying] = useState(false)

  const [activeThread, setActiveThread] = useState<LinkedInThread | null>(null)
  const [messages, setMessages] = useState<LinkedInMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [actions, setActions] = useState<LinkedInAction[]>([])
  const [actionsLoading, setActionsLoading] = useState(false)

  const fetchThreads = useCallback(async (
    status?: string, q?: string, cat?: string, p = 1,
  ) => {
    setLoading(true)
    try {
      const data = await getThreadsApi({
        status: status || "all", search: q || undefined,
        category: cat || undefined, limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE,
      })
      setThreads(data.threads)
      setTotal(data.total)
    } catch (err) { console.error("LinkedIn threads fetch failed:", err) }
    finally { setLoading(false) }
  }, [])

  const fetchActions = useCallback(async () => {
    setActionsLoading(true)
    try { setActions(await loadActions()) }
    catch (err) { console.error("LinkedIn actions fetch failed:", err) }
    finally { setActionsLoading(false) }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchThreads(statusFilter, search, categoryFilter, 1)
  }, [statusFilter, search, categoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page > 1) fetchThreads(statusFilter, search, categoryFilter, page)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const openThread = useCallback(async (thread: LinkedInThread) => {
    setActiveThread(thread)
    setMessagesLoading(true)
    try { setMessages(await loadMessages(thread.id)) }
    catch (err) { console.error("Messages fetch failed:", err) }
    finally { setMessagesLoading(false) }
    try {
      const updated = await markThreadRead(thread.id)
      setActiveThread(updated)
      setThreads((prev) => prev.map((t) => t.id === thread.id ? updated : t))
    } catch { /* non-critical */ }
  }, [])

  const closeThread = useCallback(() => {
    setActiveThread(null); setMessages([])
  }, [])

  const updateThread = useCallback(async (
    threadId: string, updates: Record<string, unknown>,
  ) => {
    try {
      const updated = await patchThread(threadId, updates)
      setThreads((prev) => prev.map((t) => t.id === threadId ? updated : t))
      if (activeThread?.id === threadId) setActiveThread(updated)
    } catch (err) { console.error("Thread update failed:", err) }
  }, [activeThread])

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!activeThread) return false
    try {
      const message = await sendLinkedInMessage(activeThread.id, content)
      if (message) setMessages((prev) => [...prev, message])
      const patch = { lastMessage: content.slice(0, 200), lastMessageDirection: "outgoing" as const, status: "waiting" as const }
      setThreads((prev) => prev.map((t) => t.id === activeThread.id ? { ...t, ...patch } : t))
      setActiveThread((prev) => prev ? { ...prev, ...patch } : prev)
      return true
    } catch (err) { console.error("Send message failed:", err); throw err }
  }, [activeThread])

  const sync = useCallback(async () => {
    setSyncing(true)
    try { await syncLinkedInAction(); fetchThreads(statusFilter, search, categoryFilter, page) }
    catch (err) { console.error("LinkedIn sync failed:", err) }
    finally { setSyncing(false) }
  }, [statusFilter, search, categoryFilter, page, fetchThreads])

  const classify = useCallback(async () => {
    setClassifying(true)
    try { await classifyAll(); fetchThreads(statusFilter, search, categoryFilter, page) }
    catch (err) { console.error("Classification failed:", err) }
    finally { setClassifying(false) }
  }, [statusFilter, search, categoryFilter, page, fetchThreads])

  const scoreThread = useCallback(async (threadId: string) => {
    const result = await scoreThreadAction(threadId)
    if (!result) return null
    const current = threads.find((t) => t.id === threadId)
    if (current) {
      const refreshed = { ...current, wampScore: result.total, qualificationData: JSON.stringify(result), isQualified: result.total >= 61 }
      setThreads((prev) => prev.map((t) => t.id === threadId ? refreshed : t))
      if (activeThread?.id === threadId) setActiveThread(refreshed)
    }
    return result
  }, [threads, activeThread])

  const enrichThread = useCallback(async (threadId: string) => {
    const result = await enrichThreadAction(threadId)
    if (result) fetchThreads(statusFilter, search, categoryFilter, page)
    return result
  }, [statusFilter, search, categoryFilter, page, fetchThreads])

  const changeClassification = useCallback(async (
    threadId: string, category: string, note: string,
  ) => {
    try {
      const updated = await classifyThread(threadId, category, note)
      setThreads((prev) => prev.map((t) => t.id === threadId ? updated : t))
      if (activeThread?.id === threadId) setActiveThread(updated)
    } catch (err) { console.error("Change classification failed:", err) }
  }, [activeThread])

  const classifyThreads = useCallback(async (threadIds: string[]) => {
    try { await classifyByIds(threadIds); fetchThreads(statusFilter, search, categoryFilter, page) }
    catch (err) { console.error("Classification failed:", err) }
  }, [statusFilter, search, categoryFilter, page, fetchThreads])

  const generateDraft = useCallback(async (threadId: string, instruction?: string) => {
    return generateDraftAction(threadId, instruction)
  }, [])

  const fetchPosts = useCallback(async (threadId: string) => {
    return fetchPostsAction(threadId)
  }, [])

  const snoozeThread = useCallback(async (threadId: string, until: string) => {
    await updateThread(threadId, { status: "snoozed", isSnoozed: true, snoozeUntil: until })
  }, [updateThread])

  const executeAction = useCallback(async (actionId: string) => {
    try {
      const action = await execAction(actionId)
      setActions((prev) => prev.map((a) => a.id === actionId ? action : a))
    } catch (err) { console.error("Action execution failed:", err) }
  }, [])

  const refetch = useCallback(() => {
    fetchThreads(statusFilter, search, categoryFilter, page)
  }, [statusFilter, search, categoryFilter, page, fetchThreads])

  return {
    threads, total, loading,
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
    search, setSearch,
    page, setPage, syncing, sync,
    classifying, classify,
    refetch,
    activeThread, messages, messagesLoading, openThread, closeThread,
    updateThread, sendMessage, snoozeThread, fetchPosts,
    scoreThread, enrichThread, generateDraft, changeClassification, classifyThreads,
    actions, actionsLoading, fetchActions, executeAction,
  }
}
