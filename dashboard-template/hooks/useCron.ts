"use client" // Requires useState, useEffect, useCallback for cron job polling and triggers

import { useState, useEffect, useCallback } from "react"

import { getCronJobsApi, triggerCronJobApi, updateCronGoalApi } from "@/services/gateway.service"

import type { CronJob } from "@/types/index"

export function useCron() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getCronJobsApi()
      setJobs(data)
      setError(null)
    } catch (err) {
      console.error("Cron fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch cron jobs")
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerJob = useCallback(
    async (jobName: string): Promise<boolean> => {
      try {
        await triggerCronJobApi(jobName)
        setTimeout(fetchJobs, 2000)
        return true
      } catch (err) {
        console.error("Cron trigger failed:", err)
        return false
      }
    },
    [fetchJobs]
  )

  const linkGoal = useCallback(
    async (cronJobName: string, goalId: string | null) => {
      setJobs((prev) => prev.map((j) =>
        j.name === cronJobName ? { ...j, goalId: goalId || undefined, goalName: undefined } : j
      ))
      try {
        await updateCronGoalApi(cronJobName, goalId)
        fetchJobs()
      } catch {
        fetchJobs()
      }
    },
    [fetchJobs]
  )

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 60000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  return { jobs, loading, error, triggerJob, linkGoal, refetch: fetchJobs }
}
