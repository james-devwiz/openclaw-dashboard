"use client" // Requires onClick handlers for page navigation

import { ChevronLeft, ChevronRight } from "lucide-react"

interface BriefPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function BriefPagination({ page, pageSize, total, onPageChange }: BriefPaginationProps) {
  if (total <= pageSize) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>Showing {start}–{end} of {total}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium disabled:opacity-40 hover:text-foreground transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-xs">{page} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium disabled:opacity-40 hover:text-foreground transition-colors"
          aria-label="Next page"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
