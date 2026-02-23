"use client" // Requires onClick handlers for page navigation

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} /> Previous
        </Button>
        <span className="text-xs">{page} / {totalPages}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
