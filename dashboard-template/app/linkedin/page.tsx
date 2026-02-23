"use client" // Requires useLinkedIn hook for state management, useState for active tab

import { useState } from "react"
import { Linkedin } from "lucide-react"

import { cn } from "@/lib/utils"
import PageHeader from "@/components/layout/PageHeader"
import LinkedInSettings from "@/components/linkedin/LinkedInSettings"
import LinkedInInbox from "@/components/linkedin/LinkedInInbox"
import ActionQueueTab from "@/components/linkedin/ActionQueueTab"
import { useLinkedIn, PAGE_SIZE } from "@/hooks/useLinkedIn"

type Tab = "inbox" | "actions"

export default function LinkedInPage() {
  const [tab, setTab] = useState<Tab>("inbox")
  const {
    threads, total, loading, statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter, search, setSearch,
    page, setPage, syncing, sync, classifying, classify,
    activeThread, messages, messagesLoading,
    openThread, closeThread, updateThread, sendMessage,
    scoreThread, enrichThread, generateDraft, changeClassification, classifyThreads,
    actions, actionsLoading, fetchActions, executeAction,
  } = useLinkedIn()

  const lastSynced = threads.length > 0
    ? threads.reduce((latest, t) => t.syncedAt > latest ? t.syncedAt : latest, "")
    : undefined

  return (
    <div>
      <PageHeader
        title="LinkedIn"
        subtitle="Inbox management and outbound actions"
        actions={
          <div className="flex items-center gap-2">
            <Linkedin size={20} className="text-[#0A66C2]" aria-hidden="true" />
          </div>
        }
      />

      <LinkedInSettings syncing={syncing} onSync={sync} lastSyncedAt={lastSynced} />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {(["inbox", "actions"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t === "inbox" ? "Inbox" : "Actions Queue"}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <LinkedInInbox
          threads={threads} total={total} loading={loading}
          statusFilter={statusFilter} onStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter} onCategoryFilter={setCategoryFilter}
          search={search} onSearch={setSearch}
          page={page} onPage={setPage} pageSize={PAGE_SIZE}
          syncing={syncing} onSync={sync}
          classifying={classifying} onClassify={classify}
          activeThread={activeThread} messages={messages} messagesLoading={messagesLoading}
          onOpenThread={openThread} onCloseThread={closeThread}
          onSendMessage={sendMessage} onUpdateThread={updateThread}
          onScoreThread={scoreThread}
          onEnrichThread={enrichThread}
          onGenerateDraft={generateDraft}
          onChangeClassification={changeClassification}
          onClassifyThreads={classifyThreads}
        />
      )}

      {tab === "actions" && (
        <ActionQueueTab
          actions={actions} loading={actionsLoading}
          onFetch={fetchActions} onExecute={executeAction}
        />
      )}
    </div>
  )
}
