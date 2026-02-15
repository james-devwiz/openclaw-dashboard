"use client" // Requires controlled inputs for search, date range, and source filter

import { Search, X } from "lucide-react"

interface BriefSearchBarProps {
  search: string
  onSearchChange: (value: string) => void
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
}

export function BriefSearchBar({
  search, onSearchChange, from, to, onFromChange, onToChange, source, onSourceChange,
}: BriefSearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search briefs..."
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground"
          aria-label="Search briefs by title or content"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="text-sm rounded-lg border border-border bg-card px-2 py-1.5 text-foreground"
          aria-label="From date"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="text-sm rounded-lg border border-border bg-card px-2 py-1.5 text-foreground"
          aria-label="To date"
        />
      </div>

      <select
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        className="text-sm rounded-lg border border-border bg-card px-2 py-2 text-foreground"
        aria-label="Filter by source"
      >
        <option value="">All Sources</option>
        <option value="cron">Cron</option>
        <option value="heartbeat">Heartbeat</option>
        <option value="manual">Manual</option>
        <option value="api">API</option>
      </select>
    </div>
  )
}
