"use client" // Requires useState for search input state, interactive filter buttons

import { useState } from "react"
import { Search, RefreshCw, Loader2, Linkedin, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { INBOX_FILTERS, CATEGORY_FILTER_OPTIONS } from "@/lib/linkedin-constants"
import { BriefPagination } from "@/components/briefs/BriefPagination"
import ThreadItem from "./ThreadItem"
import ConversationView from "./ConversationView"

import type { LinkedInThread, LinkedInMessage, ThreadCategory } from "@/types"

interface LinkedInInboxProps {
  threads: LinkedInThread[]
  total: number
  loading: boolean
  statusFilter: string
  onStatusFilter: (v: string) => void
  categoryFilter: string
  onCategoryFilter: (v: string) => void
  search: string
  onSearch: (v: string) => void
  page: number
  onPage: (p: number) => void
  pageSize: number
  syncing: boolean
  onSync: () => void
  classifying: boolean
  onClassify: () => void
  activeThread: LinkedInThread | null
  messages: LinkedInMessage[]
  messagesLoading: boolean
  onOpenThread: (t: LinkedInThread) => void
  onCloseThread: () => void
  onSendMessage: (content: string) => Promise<boolean>
  onUpdateThread: (threadId: string, updates: Record<string, unknown>) => void
  onScoreThread?: (threadId: string) => Promise<unknown>
  onEnrichThread?: (threadId: string) => Promise<unknown>
  onGenerateDraft?: (threadId: string, instruction?: string) => Promise<string[]>
  onChangeClassification?: (threadId: string, category: ThreadCategory, note: string) => void
  onClassifyThreads?: (threadIds: string[]) => Promise<unknown>
}

export default function LinkedInInbox({
  threads, total, loading, statusFilter, onStatusFilter,
  categoryFilter, onCategoryFilter, search, onSearch,
  page, onPage, pageSize, syncing, onSync, classifying, onClassify,
  activeThread, messages, messagesLoading, onOpenThread, onCloseThread,
  onSendMessage, onUpdateThread, onScoreThread, onEnrichThread, onGenerateDraft,
  onChangeClassification, onClassifyThreads,
}: LinkedInInboxProps) {
  const [searchInput, setSearchInput] = useState(search)

  const handleSearch = () => onSearch(searchInput.trim())
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch() }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Search LinkedIn threads" />
        </div>
        {search && (
          <button onClick={() => { setSearchInput(""); onSearch("") }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
        )}
        <select value={categoryFilter} onChange={(e) => onCategoryFilter(e.target.value)}
          className="text-xs px-2 py-2 rounded-lg border border-border bg-card text-foreground"
          aria-label="Filter by category">
          {CATEGORY_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button onClick={onClassify} disabled={classifying} variant="outline"
          aria-label="Classify threads">
          {classifying ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
          Classify
        </Button>
        <Button onClick={onSync} disabled={syncing} variant="outline"
          aria-label="Sync LinkedIn inbox">
          {syncing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
          Sync
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        {INBOX_FILTERS.map((f) => (
          <button key={f.value} onClick={() => onStatusFilter(f.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors",
              statusFilter === f.value
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-3">
          {total} conversation{total !== 1 ? "s" : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <Linkedin size={32} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">
              {search || statusFilter !== "all" || categoryFilter !== "all"
                ? "No conversations match your filters"
                : "No LinkedIn conversations. Hit Sync to import."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <ThreadItem key={thread.id} thread={thread}
              isActive={activeThread?.id === thread.id}
              onClick={() => onOpenThread(thread)} />
          ))}
        </div>
      )}

      <BriefPagination page={page} pageSize={pageSize} total={total} onPageChange={onPage} />

      {/* Conversation slide-over */}
      {activeThread && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={onCloseThread} aria-hidden="true" />
          <ConversationView
            thread={activeThread} messages={messages} loading={messagesLoading}
            onClose={onCloseThread} onSend={onSendMessage}
            onUpdateStatus={(status) => onUpdateThread(activeThread.id, { status })}
            onUpdateThread={onUpdateThread}
            onScoreThread={onScoreThread ? async (id: string) => { await onScoreThread(id) } : undefined}
            onEnrichThread={onEnrichThread ? async (id: string) => { await onEnrichThread(id) } : undefined}
            onGenerateDraft={onGenerateDraft}
            onChangeClassification={onChangeClassification}
            onClassifyThread={onClassifyThreads ? async (ids: string[]) => { await onClassifyThreads(ids) } : undefined}
          />
        </>
      )}
    </div>
  )
}
