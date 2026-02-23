"use client" // Requires useChat hook for state management; composes chat sub-components

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import ChatTopicSelector, { TOPICS, TOPIC_ICONS } from "@/components/chat/ChatTopicSelector"
import ChatEmptyState from "@/components/chat/ChatEmptyState"
import ChatMessageList from "@/components/chat/ChatMessageList"
import ChatInput from "@/components/chat/ChatInput"
import ChatHistoryDrawer from "@/components/chat/ChatHistoryDrawer"
import ModelSelector from "@/components/chat/ModelSelector"
import SaveToMemoryModal from "@/components/memory/SaveToMemoryModal"
import { useChat } from "@/hooks/useChat"
import { useChatUnread } from "@/hooks/useChatUnread"
import { useSaveToMemory } from "@/hooks/useSaveToMemory"

export default function ChatPage() {
  const {
    messages, activeTopic, setActiveTopic, isStreaming, loading,
    sendMessage,
    selectedModel, setSelectedModel, planMode, setPlanMode,
    researchMode, setResearchMode,
    currentSessionId, sessions, createNewSession, switchSession,
    renameSession, removeSession, cleanup,
  } = useChat()

  const { counts: unreadCounts, markRead } = useChatUnread()

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // Mark topic as read on view / topic switch
  useEffect(() => {
    markRead(activeTopic)
  }, [activeTopic]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark topic as read when streaming finishes (new messages arrived while viewing)
  useEffect(() => {
    if (!isStreaming) {
      markRead(activeTopic)
    }
  }, [isStreaming]) // eslint-disable-line react-hooks/exhaustive-deps

  const { isOpen: isSaveOpen, content: saveContent, openSaveModal, closeSaveModal } = useSaveToMemory()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const topicConfig = TOPICS.find((t) => t.id === activeTopic)!
  const TopicIcon = TOPIC_ICONS[activeTopic]

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <ChatTopicSelector
        activeTopic={activeTopic}
        onTopicChange={setActiveTopic}
        onNewChat={createNewSession}
        onToggleHistory={() => setIsHistoryOpen((v) => !v)}
        isHistoryOpen={isHistoryOpen}
        unreadCounts={unreadCounts}
        actionSlot={
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
        }
      />

      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <ChatEmptyState
            description={topicConfig.description}
            quickActions={topicConfig.quickActions}
            onAction={sendMessage}
          />
        ) : (
          <ChatMessageList messages={messages} isStreaming={isStreaming} onSaveToMemory={openSaveModal} />
        )}
      </div>

      <ChatInput
        activeTopic={activeTopic}
        topicLabel={topicConfig.label}
        TopicIcon={TopicIcon}
        isStreaming={isStreaming}
        planMode={planMode}
        onPlanModeToggle={() => setPlanMode((v) => !v)}
        onSend={sendMessage}
        showResearchButtons={activeTopic === "research"}
        researchMode={researchMode}
        onResearchModeChange={setResearchMode}
      />

      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={currentSessionId}
        activeTopic={activeTopic}
        onSelectSession={switchSession}
        onRenameSession={renameSession}
        onDeleteSession={removeSession}
      />
      {isSaveOpen && <SaveToMemoryModal content={saveContent} onClose={closeSaveModal} />}
    </div>
  )
}
