"use client" // Requires onClick handlers for topic switching; framer-motion for animated pill

import { motion } from "framer-motion"
import {
  MessageSquare, FileText, BarChart3, Search,
  ClipboardList, GraduationCap, Wrench, Brain, Plus, History,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TOPIC_SYSTEM_PROMPTS } from "@/lib/chat-prompts"
import type { ChatTopic, ChatTopicConfig } from "@/types/index"

const TOPICS: ChatTopicConfig[] = [
  { id: "general", label: "General", description: "General chitchat with your AI", systemPrompt: TOPIC_SYSTEM_PROMPTS.general, quickActions: ["System health check", "What's on my plate today?"] },
  { id: "briefs", label: "Briefs", description: "All briefs: morning briefs, pre-meeting briefs, evening summaries", systemPrompt: TOPIC_SYSTEM_PROMPTS.briefs, quickActions: ["Generate morning brief", "Pre-meeting summary"] },
  { id: "reports", label: "Reports", description: "Automated reports from cron jobs: weekly reviews, cost reports, business meta-analysis", systemPrompt: TOPIC_SYSTEM_PROMPTS.reports, quickActions: ["Run cost report", "Weekly review summary"] },
  { id: "research", label: "Research", description: "Web search results, saved articles, overnight research findings", systemPrompt: TOPIC_SYSTEM_PROMPTS.research, quickActions: ["Summarise recent research", "What's trending?"] },
  { id: "tasks", label: "Tasks & Goals", description: "To-do tracking, goal setting, progress updates", systemPrompt: TOPIC_SYSTEM_PROMPTS.tasks, quickActions: ["Show active tasks", "What's blocked?"] },
  { id: "coaching", label: "Coaching", description: "Accountability, business coaching, marketing coaching, habit tracking", systemPrompt: TOPIC_SYSTEM_PROMPTS.coaching, quickActions: ["Weekly accountability check-in", "Review my goals progress"] },
  { id: "system-improvement", label: "System Improvement", description: "AI system improvements, workspace optimisation, cron tuning, prompt refinement", systemPrompt: TOPIC_SYSTEM_PROMPTS["system-improvement"], quickActions: ["Review system health", "Suggest cron improvements"] },
  { id: "memory", label: "Memory", description: "Memory system dumps, fact logs, context updates, memory maintenance logs", systemPrompt: TOPIC_SYSTEM_PROMPTS.memory, quickActions: ["What's in memory?", "Recent memory updates"] },
]

export const TOPIC_ICONS: Record<ChatTopic, typeof MessageSquare> = {
  general: MessageSquare, briefs: FileText, reports: BarChart3, research: Search,
  tasks: ClipboardList, coaching: GraduationCap, "system-improvement": Wrench, memory: Brain,
}

export { TOPICS }

interface ChatTopicSelectorProps {
  activeTopic: ChatTopic
  onTopicChange: (topic: ChatTopic) => void
  onNewChat: () => void
  onToggleHistory: () => void
  isHistoryOpen: boolean
  actionSlot?: React.ReactNode
  unreadCounts?: Record<string, number>
}

export default function ChatTopicSelector({
  activeTopic, onTopicChange,
  onNewChat, onToggleHistory, isHistoryOpen, actionSlot, unreadCounts,
}: ChatTopicSelectorProps) {
  return (
    <div className="flex items-center justify-between px-4 pb-4">
      <div className="flex items-center gap-1.5">
        {TOPICS.map((topic) => {
          const Icon = TOPIC_ICONS[topic.id]
          const isActive = topic.id === activeTopic
          const unread = unreadCounts?.[topic.id] || 0
          return (
            <button
              key={topic.id}
              onClick={() => onTopicChange(topic.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
                isActive ? "text-blue-600 font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="topic-pill"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-full"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon size={14} />
                {topic.label}
                {unread > 0 && !isActive && (
                  <span className="min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                    {unread}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-1">
        {actionSlot}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          aria-label="New chat"
        >
          <Plus size={12} /> New
        </Button>
        <button
          onClick={onToggleHistory}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
            isHistoryOpen
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
          )}
          aria-label="Toggle chat history"
        >
          <History size={12} /> History
        </button>
      </div>
    </div>
  )
}
