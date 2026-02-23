import { Search } from "lucide-react"

import { LEAD_STATUSES, BUSINESSES, SOURCES } from "@/lib/lead-constants"

interface LeadTableFiltersProps {
  filters: { status: string; business: string; source: string; search: string }
  onFilterChange: (key: "status" | "business" | "source" | "search", value: string) => void
}

export default function LeadTableFilters({ filters, onFilterChange }: LeadTableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[180px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search leads..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <select
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={filters.business}
        onChange={(e) => onFilterChange("business", e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
        aria-label="Filter by business"
      >
        <option value="">All Businesses</option>
        {BUSINESSES.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <select
        value={filters.source}
        onChange={(e) => onFilterChange("source", e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
        aria-label="Filter by source"
      >
        <option value="">All Sources</option>
        {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
