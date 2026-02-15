"use client" // Requires AnimatePresence for drawer slide animation, useEffect for Escape key

import { useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageSquare } from "lucide-react"

import ChatSessionItem from "@/components/chat/ChatSessionItem"

import type { ChatSession, ChatTopic } from "@/types/index"

interface ChatHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  sessions: ChatSession[]
  activeSessionId: string | null
  activeTopic: ChatTopic
  onSelectSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, title: string, topic: ChatTopic) => void
  onDeleteSession: (sessionId: string, topic: ChatTopic) => void
}

function groupByDate(sessions: ChatSession[]) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toDateString()
  const yesterdayStr = yesterday.toDateString()

  const groups: { label: string; sessions: ChatSession[] }[] = []
  const todayGroup: ChatSession[] = []
  const yesterdayGroup: ChatSession[] = []
  const olderGroup: ChatSession[] = []

  for (const s of sessions) {
    const d = new Date(s.updatedAt).toDateString()
    if (d === todayStr) todayGroup.push(s)
    else if (d === yesterdayStr) yesterdayGroup.push(s)
    else olderGroup.push(s)
  }

  if (todayGroup.length) groups.push({ label: "Today", sessions: todayGroup })
  if (yesterdayGroup.length) groups.push({ label: "Yesterday", sessions: yesterdayGroup })
  if (olderGroup.length) groups.push({ label: "Older", sessions: olderGroup })
  return groups
}

export default function ChatHistoryDrawer({
  isOpen, onClose, sessions, activeSessionId, activeTopic,
  onSelectSession, onRenameSession, onDeleteSession,
}: ChatHistoryDrawerProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  const groups = useMemo(() => groupByDate(sessions), [sessions])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Chat History</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                aria-label="Close history drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <MessageSquare size={24} />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-medium text-muted-foreground px-1 mb-1.5">
                      {group.label}
                    </p>
                    <div className="space-y-1" role="list" aria-label={`${group.label} sessions`}>
                      {group.sessions.map((session) => (
                        <ChatSessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          onSelect={() => { onSelectSession(session.id); onClose() }}
                          onRename={(title) => onRenameSession(session.id, title, activeTopic)}
                          onDelete={() => onDeleteSession(session.id, activeTopic)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
