"use client" // Requires useDocuments hook for filtered document fetching, state for modals/slide-over

import { useMemo, useState } from "react"
import { FileText, RefreshCw, Search, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import { DocumentFilters } from "@/components/documents/DocumentFilters"
import { DocumentListItem } from "@/components/documents/DocumentListItem"
import DocumentFolderNav from "@/components/documents/DocumentFolderNav"
import CreateDocumentModal from "@/components/documents/CreateDocumentModal"
import DocumentSlideOver from "@/components/documents/DocumentSlideOver"
import { BriefPagination } from "@/components/briefs/BriefPagination"
import { useDocuments, PAGE_SIZE } from "@/hooks/useDocuments"
import { getAgentNameMap } from "@/lib/architecture-agents"

import type { Document, DocumentFolder } from "@/types"

export default function DocumentsPage() {
  const {
    documents, total, category, setCategory, search, setSearch,
    page, setPage, loading, createDocument, updateDocument, removeDocument, refetch,
    activeFilter, setActiveFilter, counts,
  } = useDocuments()
  const [searchInput, setSearchInput] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const agentNames = useMemo(() => getAgentNameMap(), [])

  const handleSearch = () => setSearch(searchInput.trim())
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch() }

  // Derive defaults for new docs from active filter
  const defaultFolder: DocumentFolder | undefined = activeFilter.type === "folder" ? activeFilter.folder : undefined
  const defaultProjectId = activeFilter.type === "project" ? activeFilter.projectId : undefined
  const defaultAgentId = activeFilter.type === "agent" ? activeFilter.agentId : undefined

  // Resolve agent names on docs for display
  const enrichedDocs = useMemo(() => documents.map((d) => ({
    ...d,
    agentName: d.agentId ? (agentNames[d.agentId] || d.agentId) : undefined,
  })), [documents, agentNames])

  return (
    <div className="flex gap-6">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block w-52 shrink-0">
        <div className="sticky top-4">
          <DocumentFolderNav
            counts={counts}
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
            agentNames={agentNames}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Documents"
          subtitle="Meeting transcripts, email drafts, notes, and reference material"
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreate(true)} aria-label="Create new document">
                <Plus size={14} aria-hidden="true" /> New
              </Button>
              <Button variant="outline" size="icon" onClick={refetch} aria-label="Refresh documents">
                <RefreshCw size={16} aria-hidden="true" />
              </Button>
            </div>
          }
        />

        {/* Search bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="Search titles, tags, and content..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Search documents" />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchInput(""); setSearch("") }}
              className="text-blue-600 dark:text-blue-400 hover:underline">Clear</Button>
          )}
        </div>

        {/* Category filters */}
        <div className="mb-6">
          <DocumentFilters selected={category} onSelect={setCategory} />
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-muted-foreground mb-4">
            {total} document{total !== 1 ? "s" : ""}{category ? ` in ${category}` : ""}{search ? ` matching "${search}"` : ""}
          </p>
        )}

        {/* Document list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : enrichedDocs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <FileText size={32} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">
                {search || category || activeFilter.type !== "all" ? "No documents match your filters" : "No documents yet"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {enrichedDocs.map((doc) => (
              <DocumentListItem key={doc.id} doc={doc} onDelete={removeDocument} onOpen={setSelectedDoc} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <BriefPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

        {/* Create modal */}
        {showCreate && (
          <CreateDocumentModal
            onClose={() => setShowCreate(false)}
            onCreate={createDocument}
            defaultFolder={defaultFolder}
            defaultProjectId={defaultProjectId}
            defaultAgentId={defaultAgentId}
          />
        )}

        {/* Document slide-over */}
        <DocumentSlideOver
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={async (id, updates) => {
            await updateDocument(id, updates)
            setSelectedDoc((prev) => prev ? { ...prev, ...updates } : null)
          }}
          onDelete={(id) => { removeDocument(id); setSelectedDoc(null) }}
        />
      </div>
    </div>
  )
}
