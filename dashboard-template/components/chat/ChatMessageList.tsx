"use client" // Requires useRef, useEffect for auto-scroll; framer-motion for message animations

import { useRef, useEffect, type ReactNode } from "react"

import { motion, AnimatePresence } from "framer-motion"

import { BookmarkPlus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThinkingIndicator from "@/components/chat/ThinkingIndicator"
import MarkdownMessage from "@/components/chat/MarkdownMessage"
import ChatAttachmentDisplay from "@/components/chat/ChatAttachmentDisplay"
import { stripMetaBlocks } from "@/lib/chat-prompts"
import { cn } from "@/lib/utils"

import type { ChatMessage, ChatAttachment } from "@/types/index"

const PLACEHOLDER_RE = /^\[(\d+ )?file\(s\) attached\]$/

function isPlaceholderText(content: string, attachments?: ChatAttachment[]): boolean {
  return Boolean(attachments?.length && PLACEHOLDER_RE.test(content.trim()))
}

interface ChatMessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
  onSaveToMemory?: (content: string) => void
}

const MENTION_RE = /@(\w[\w-]*)/g

function highlightMentions(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className="bg-blue-500/20 rounded px-1">
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

export default function ChatMessageList({ messages, isStreaming, onSaveToMemory }: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const showThinking = isStreaming && messages.at(-1)?.role === "assistant" && !messages.at(-1)?.content

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  return (
    <div className="space-y-4 pb-4 max-w-3xl mx-auto">
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex items-end gap-3", msg.role === "user" && "flex-row-reverse")}
          >
            {msg.role === "assistant" && (
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">JA</AvatarFallback>
              </Avatar>
            )}
            <div className="group relative max-w-[80%]">
              {msg.role === "assistant" && msg.metadata?.agentName && (
                <span className="block mb-1 text-[10px] text-muted-foreground/70 font-medium tracking-wide uppercase">{msg.metadata.agentName}</span>
              )}
              <div
                className={cn(
                  "px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-br-sm whitespace-pre-wrap"
                    : "bg-card border border-border rounded-2xl rounded-bl-sm shadow-sm text-foreground",
                  msg.status === "error" && "border-red-500/50",
                )}
              >
                {msg.role === "assistant" ? (
                  <>
                    {msg.content ? <MarkdownMessage content={stripMetaBlocks(msg.content)} /> : (msg.isStreaming ? "" : "No response")}
                    {msg.isStreaming && msg.content && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 bg-current ml-0.5 align-text-bottom"
                      />
                    )}
                  </>
                ) : (
                  <>
                    {msg.attachments?.length && (
                      <ChatAttachmentDisplay attachments={msg.attachments} isUser />
                    )}
                    {isPlaceholderText(msg.content, msg.attachments) ? null : highlightMentions(msg.content || "")}
                  </>
                )}
              </div>
              {msg.role === "assistant" && msg.content && !msg.isStreaming && onSaveToMemory && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onSaveToMemory(msg.content)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Save to memory"
                  title="Save to memory"
                >
                  <BookmarkPlus size={12} className="text-muted-foreground" />
                </Button>
              )}
              {msg.role === "assistant" && !msg.isStreaming && msg.metadata?.brief_saved && (
                <Link href="/briefs" className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs hover:underline w-fit">
                  <CheckCircle2 size={12} />
                  Saved to Briefs ({msg.metadata.briefType})
                </Link>
              )}
              {msg.role === "assistant" && !msg.isStreaming && msg.metadata?.brief_updated && (
                <Link href="/briefs" className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs hover:underline w-fit">
                  <CheckCircle2 size={12} />
                  Brief updated
                </Link>
              )}
              {msg.role === "assistant" && !msg.isStreaming && msg.metadata?.tasks_created && msg.metadata.tasks_created.length > 0 && (
                <Link href="/tasks" className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs hover:underline w-fit">
                  <CheckCircle2 size={12} />
                  {msg.metadata.tasks_created.length} task(s) created
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {showThinking && <ThinkingIndicator />}
      <div ref={endRef} />
    </div>
  )
}
