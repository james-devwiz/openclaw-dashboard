"use client" // Requires useState, useEffect, useCallback for date-based brief fetching

import { useState, useEffect, useCallback } from "react"

import { getBriefsApi, deleteBriefApi } from "@/services/brief.service"

import type { Brief } from "@/types"

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" })
}

export function useBriefs() {
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [date, setDate] = useState(todayStr)
  const [loading, setLoading] = useState(true)

  const fetchBriefs = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const data = await getBriefsApi(d)
      setBriefs(data)
    } catch (err) {
      console.error("Briefs fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBriefs(date)
  }, [date, fetchBriefs])

  const removeBrief = useCallback(async (id: string) => {
    await deleteBriefApi(id)
    setBriefs((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const refetch = useCallback(() => fetchBriefs(date), [date, fetchBriefs])

  return { briefs, date, setDate, loading, removeBrief, refetch }
}
