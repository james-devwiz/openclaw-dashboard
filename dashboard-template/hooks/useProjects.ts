"use client" // Requires useState, useEffect, useCallback for project list state management

import { useState, useEffect, useCallback } from "react"

import { getProjectsApi, createProjectApi, updateProjectApi, deleteProjectApi } from "@/services/project.service"

import type { Project, CreateProjectInput, UpdateProjectInput } from "@/types/index"

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjectsApi()
      setProjects(data)
      setError(null)
    } catch (err) {
      console.error("Projects fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = useCallback(async (input: CreateProjectInput) => {
    const project = await createProjectApi(input)
    setProjects((prev) => [project, ...prev])
    return project
  }, [])

  const updateProject = useCallback(async (id: string, updates: UpdateProjectInput) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    try {
      await updateProjectApi(id, updates)
    } catch {
      fetchProjects()
    }
  }, [fetchProjects])

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    try {
      await deleteProjectApi(id)
    } catch {
      fetchProjects()
    }
  }, [fetchProjects])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, loading, error, createProject, updateProject, deleteProject, refresh: fetchProjects }
}
