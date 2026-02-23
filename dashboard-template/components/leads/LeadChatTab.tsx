"use client" // Requires useState for history drawer; composes chat sub-components with lead chat hook

import { useState } from "react"
import { Loader2, UserPlus, History, Plus } from "lucide-react"

import ChatMessageList from "@/components/chat/ChatMessageList"
import ChatHistoryDrawer from "@/components/chat/ChatHistoryDrawer"
import ModelSelector from "@/components/chat/ModelSelector"
import LeadChatInput from "./LeadChatInput"
import { useLeadChat } from "@/hooks/useLeadChat"

export default function LeadChatTab() {
  const chat = useLeadChat()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    <div className="flex flex-col h-[calc(100vh-20rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
        <ModelSelector
          selectedModel={chat.selectedModel}
          onSelectModel={chat.setSelectedModel}
        />
        <div className="flex items-center gap-1">
          <button
            onClick={chat.createNewSession}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="New chat session"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Chat history"
          >
            <History size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {chat.loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <UserPlus size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Chat about lead generation strategy, targeting, and pipeline
            </p>
          </div>
        ) : (
          <ChatMessageList messages={chat.messages} isStreaming={chat.isStreaming} />
        )}
      </div>

      {/* Input */}
      <LeadChatInput isStreaming={chat.isStreaming} onSend={chat.sendMessage} />

      {/* History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={chat.sessions}
        activeSessionId={chat.currentSessionId}
        activeTopic="general"
        onSelectSession={chat.switchSession}
        onRenameSession={() => {}}
        onDeleteSession={() => {}}
      />
    </div>
  )
}
