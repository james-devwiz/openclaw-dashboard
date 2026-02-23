"use client" // Requires controlled input for search field

import { Search, X } from "lucide-react"

interface IdeaSearchBarProps {
  search: string
  onSearchChange: (value: string) => void
}

export default function IdeaSearchBar({ search, onSearchChange }: IdeaSearchBarProps) {
  return (
    <div className="relative mb-4 max-w-md">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search ideas..."
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground"
        aria-label="Search ideas by title or description"
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
  )
}
