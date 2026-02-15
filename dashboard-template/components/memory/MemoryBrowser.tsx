"use client" // Requires useMemory hook for browsing/search state

import { Search } from "lucide-react"

import MemoryCategoryNav from "./MemoryCategoryNav"
import MemoryCard from "./MemoryCard"
import MemoryDetail from "./MemoryDetail"
import MemorySuggestionBanner from "./MemorySuggestionBanner"
import EmptyState from "@/components/ui/EmptyState"
import { useMemory } from "@/hooks/useMemory"

export default function MemoryBrowser() {
  const {
    items, categoryCounts, selectedItem, category, query, loading, refs,
    search, filterCategory, selectItem, clearSelection, saveItem, loadRefs, refetch,
  } = useMemory()

  // Lazy-load refs when detail panel opens
  const selectedRefs = selectedItem ? (refs[selectedItem.relativePath] || []) : []
  if (selectedItem && Object.keys(refs).length === 0) loadRefs()

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Category sidebar */}
      <div className="w-48 shrink-0 hidden md:block">
        <MemoryCategoryNav selected={category} counts={categoryCounts} onSelect={filterCategory} />
      </div>

      {/* Main content */}
      <div className="flex-1">
        <MemorySuggestionBanner onSuggestionApplied={refetch} />

        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Search workspace files..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-claw-blue/20"
              aria-label="Search workspace files"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Loading workspace files...</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No files found"
            description={query ? "Try a different search term" : "No workspace files available"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <MemoryCard key={item.id} item={item} query={query || undefined} onClick={(i) => selectItem(i.id)} />
            ))}
          </div>
        )}
      </div>

      <MemoryDetail
        item={selectedItem}
        onClose={clearSelection}
        onSave={saveItem}
        referencedBy={selectedRefs}
        onSelectRef={(relPath) => selectItem(btoa(relPath).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""))}
      />
    </div>
  )
}
