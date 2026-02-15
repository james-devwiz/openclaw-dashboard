"use client" // Requires useDocuments hook for filtered document fetching and state

import { useState } from "react"
import { FileText, RefreshCw, Search } from "lucide-react"

import PageHeader from "@/components/layout/PageHeader"
import { DocumentFilters } from "@/components/documents/DocumentFilters"
import { DocumentListItem } from "@/components/documents/DocumentListItem"
import { useDocuments } from "@/hooks/useDocuments"

export default function DocumentsPage() {
  const { documents, total, category, setCategory, search, setSearch, loading, removeDocument, refetch } = useDocuments()
  const [searchInput, setSearchInput] = useState("")

  const handleSearch = () => setSearch(searchInput.trim())
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Meeting transcripts, email drafts, notes, and reference material"
        actions={
          <button
            onClick={refetch}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh documents"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        }
      />

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by title or tags..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Search documents"
          />
        </div>
        {search && (
          <button
            onClick={() => { setSearchInput(""); setSearch("") }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear
          </button>
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
      ) : documents.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <FileText size={32} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">
              {search || category ? "No documents match your filters" : "No documents yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentListItem key={doc.id} doc={doc} onDelete={removeDocument} />
          ))}
        </div>
      )}
    </div>
  )
}
