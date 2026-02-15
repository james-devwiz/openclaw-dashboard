"use client" // Requires useCron/useGoals hooks, useState for expand/trigger/sort state

import { useState, useCallback, useMemo } from "react"
import { Timer } from "lucide-react"

import { useCron } from "@/hooks/useCron"
import { useGoals } from "@/hooks/useGoals"
import RecurringDesktop from "./RecurringDesktop"
import RecurringMobile from "./RecurringMobile"
import type { SortField, SortDir } from "./recurring-shared"

export default function RecurringTable() {
  const { jobs, loading, triggerJob, linkGoal } = useCron()
  const { goals } = useGoals()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [triggered, setTriggered] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>("nextRun")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const aVal = a[sortField] || ""
      const bVal = b[sortField] || ""
      if (!aVal && !bVal) return 0
      if (!aVal) return 1
      if (!bVal) return -1
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [jobs, sortField, sortDir])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }, [sortField])

  const toggle = useCallback((name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }, [])

  const handleTrigger = useCallback(async (name: string) => {
    setTriggered((prev) => new Set(prev).add(name))
    await triggerJob(name)
    setTimeout(() => setTriggered((prev) => { const n = new Set(prev); n.delete(name); return n }), 3000)
  }, [triggerJob])

  const handleGoalChange = useCallback((jobName: string, goalId: string) => {
    linkGoal(jobName, goalId || null)
  }, [linkGoal])

  if (loading) return <p className="text-muted-foreground text-sm">Loading cron jobs...</p>

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-8 text-center">
          <Timer size={32} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No cron jobs configured.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <RecurringDesktop
        jobs={sortedJobs} goals={goals} expanded={expanded} triggered={triggered}
        sortField={sortField} sortDir={sortDir} onSort={handleSort}
        onToggle={toggle} onTrigger={handleTrigger} onGoalChange={handleGoalChange}
      />
      <RecurringMobile
        jobs={sortedJobs} goals={goals} expanded={expanded} triggered={triggered}
        onToggle={toggle} onTrigger={handleTrigger} onGoalChange={handleGoalChange}
      />
    </>
  )
}
