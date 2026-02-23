"use client" // Requires useState for filter tab; useApprovals hook for data

import { useState } from "react"

import { RefreshCw, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import ApprovalCard from "@/components/approvals/ApprovalCard"
import FilterBar from "@/components/ui/FilterBar"
import EmptyState from "@/components/ui/EmptyState"
import { useApprovals } from "@/hooks/useApprovals"

const FILTERS = [
  { id: "Pending", label: "Pending" },
  { id: "Approved", label: "Approved" },
  { id: "Responded", label: "Responded" },
  { id: "Deferred", label: "Deferred" },
  { id: "Rejected", label: "Rejected" },
]

export default function ApprovalsPage() {
  const { items, pendingCount, loading, respond, revise, revisingId, refetch } = useApprovals()
  const [filter, setFilter] = useState("Pending")

  const filtered = items.filter((i) => i.status === filter)

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle={`Human-in-the-loop decisions${pendingCount > 0 ? ` — ${pendingCount} pending` : ""}`}
        actions={
          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh approvals">
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
        }
      />

      <div className="mb-6">
        <FilterBar filters={FILTERS} selected={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading approvals...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={`No ${filter.toLowerCase()} approvals`}
          description="Approval requests from the AI will appear here"
        />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {filtered.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              onRespond={respond}
              onRevise={revise}
              revising={revisingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
