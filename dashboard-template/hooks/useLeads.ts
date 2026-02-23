"use client" // Requires useState, useEffect, useCallback for lead state, filtering, and bulk selection

import { useState, useEffect, useCallback } from "react"

import {
  getLeadsApi, getLeadStatsApi, createLeadApi,
  updateLeadApi, deleteLeadApi, exportLeadsCsvApi,
  enrichLeadApi, generateOutreachApi, generateResearchSummaryApi,
  executeOutreachApi, logCallOutcomeApi, executeFollowUpApi,
} from "@/services/lead.service"

import type { Lead, LeadStatus, LeadStats } from "@/types"

interface Filters {
  status: string; business: string; source: string; search: string
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<Filters>({ status: "", business: "", source: "", search: "" })

  const fetchLeads = useCallback(async () => {
    try {
      const opts = {
        status: filters.status || undefined,
        business: filters.business || undefined,
        source: filters.source || undefined,
        search: filters.search || undefined,
      }
      const data = await getLeadsApi(opts)
      setLeads(data.leads)
      setTotal(data.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leads")
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    try {
      const s = await getLeadStatsApi()
      setStats(s)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])
  useEffect(() => { fetchStats() }, [fetchStats])

  const addLead = useCallback(async (input: Parameters<typeof createLeadApi>[0]) => {
    const lead = await createLeadApi(input)
    setLeads((prev) => [lead, ...prev])
    fetchStats()
    return lead
  }, [fetchStats])

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } as Lead : l))
    try {
      await updateLeadApi(id, updates)
      fetchStats()
    } catch { fetchLeads() }
  }, [fetchLeads, fetchStats])

  const moveLead = useCallback(async (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    try {
      await updateLeadApi(id, { status })
      fetchStats()
    } catch { fetchLeads() }
  }, [fetchLeads, fetchStats])

  const removeLead = useCallback(async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    try {
      await deleteLeadApi(id)
      fetchStats()
    } catch { fetchLeads() }
  }, [fetchLeads, fetchStats])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))
    )
  }, [leads])

  const exportSelected = useCallback(async () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined
    const blob = await exportLeadsCsvApi(ids)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedIds])

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setSelectedIds(new Set())
  }, [])

  const [enriching, setEnriching] = useState<string | null>(null)
  const [generatingOutreach, setGeneratingOutreach] = useState<string | null>(null)
  const [generatingResearch, setGeneratingResearch] = useState<string | null>(null)
  const [executingOutreach, setExecutingOutreach] = useState<string | null>(null)
  const [loggingCall, setLoggingCall] = useState<string | null>(null)
  const [executingFollowUp, setExecutingFollowUp] = useState<string | null>(null)

  const enrichLeadAction = useCallback(async (id: string) => {
    setEnriching(id)
    try {
      const result = await enrichLeadApi(id)
      setLeads((prev) => prev.map((l) => l.id === id ? result.lead : l))
      fetchStats()
      return result
    } finally { setEnriching(null) }
  }, [fetchStats])

  const generateOutreachAction = useCallback(async (id: string) => {
    setGeneratingOutreach(id)
    try {
      const result = await generateOutreachApi(id)
      setLeads((prev) => prev.map((l) => l.id === id ? result.lead : l))
      fetchStats()
      return result
    } finally { setGeneratingOutreach(null) }
  }, [fetchStats])

  const generateResearchAction = useCallback(async (id: string) => {
    setGeneratingResearch(id)
    try {
      const lead = await generateResearchSummaryApi(id)
      setLeads((prev) => prev.map((l) => l.id === id ? lead : l))
      return lead
    } finally { setGeneratingResearch(null) }
  }, [])

  const executeOutreachAction = useCallback(async (id: string) => {
    setExecutingOutreach(id)
    try {
      const lead = await executeOutreachApi(id)
      setLeads((prev) => prev.map((l) => l.id === id ? lead : l))
      fetchStats()
      return lead
    } finally { setExecutingOutreach(null) }
  }, [fetchStats])

  const logCallOutcomeAction = useCallback(async (id: string, outcome: string, notes: string) => {
    setLoggingCall(id)
    try {
      const lead = await logCallOutcomeApi(id, outcome, notes)
      setLeads((prev) => prev.map((l) => l.id === id ? lead : l))
      fetchStats()
      return lead
    } finally { setLoggingCall(null) }
  }, [fetchStats])

  const executeFollowUpAction = useCallback(async (id: string) => {
    setExecutingFollowUp(id)
    try {
      const lead = await executeFollowUpApi(id)
      setLeads((prev) => prev.map((l) => l.id === id ? lead : l))
      fetchStats()
      return lead
    } finally { setExecutingFollowUp(null) }
  }, [fetchStats])

  return {
    leads, total, stats, loading, error, selectedIds, filters,
    addLead, updateLead, moveLead, removeLead, refetch: fetchLeads,
    toggleSelect, selectAll, exportSelected, setFilter,
    enrichLead: enrichLeadAction, enriching,
    generateOutreach: generateOutreachAction, generatingOutreach,
    generateResearchSummary: generateResearchAction, generatingResearch,
    executeOutreach: executeOutreachAction, executingOutreach,
    logCallOutcome: logCallOutcomeAction, loggingCall,
    executeFollowUp: executeFollowUpAction, executingFollowUp,
  }
}
