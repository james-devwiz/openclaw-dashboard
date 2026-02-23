"use client" // React hook with useState, useEffect, useCallback for idea source state management

import { useState, useEffect, useCallback } from "react"

import {
  getIdeaSourcesApi, validateIdeaSourceApi, createIdeaSourceApi,
  deleteIdeaSourceApi, toggleIdeaSourceApi,
} from "@/services/idea-source.service"
import type { IdeaSource, IdeaSourcePlatform, IdeaSourceFrequency, IdeaSourceValidation } from "@/types"

export function useIdeaSources() {
  const [sources, setSources] = useState<IdeaSource[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  const fetchSources = useCallback(async () => {
    try {
      const { sources } = await getIdeaSourcesApi()
      setSources(sources)
    } catch (err) {
      console.error("Failed to fetch idea sources:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSources() }, [fetchSources])

  const validateSource = useCallback(async (input: {
    platform: IdeaSourcePlatform; url: string; comments?: string
  }): Promise<IdeaSourceValidation | null> => {
    setValidating(true)
    try {
      return await validateIdeaSourceApi(input)
    } catch (err) {
      console.error("Validation failed:", err)
      return null
    } finally {
      setValidating(false)
    }
  }, [])

  const createSource = useCallback(async (input: {
    platform: IdeaSourcePlatform; url: string; comments?: string
    frequency: IdeaSourceFrequency; validationScore?: number
    validationSummary?: string; validationDetails?: string
  }) => {
    const { source } = await createIdeaSourceApi(input)
    await fetchSources()
    return source
  }, [fetchSources])

  const deleteSource = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteIdeaSourceApi(id)
      await fetchSources()
      return true
    } catch (err) {
      console.error("Delete failed:", err)
      return false
    }
  }, [fetchSources])

  const toggleSource = useCallback(async (id: string): Promise<boolean> => {
    try {
      await toggleIdeaSourceApi(id)
      await fetchSources()
      return true
    } catch (err) {
      console.error("Toggle failed:", err)
      return false
    }
  }, [fetchSources])

  return { sources, loading, validating, fetchSources, validateSource, createSource, deleteSource, toggleSource }
}
