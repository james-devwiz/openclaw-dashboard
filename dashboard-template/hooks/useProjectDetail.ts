"use client" // Requires useState, useEffect, useCallback for single project + files state

import { useState, useEffect, useCallback } from "react"

import {
  getProjectApi, updateProjectApi,
  getProjectFilesApi, addProjectFilesApi, removeProjectFileApi,
} from "@/services/project.service"

import type { Project, ProjectFile, UpdateProjectInput } from "@/types/index"

export function useProjectDetail(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    try {
      const [proj, fileList] = await Promise.all([
        getProjectApi(projectId),
        getProjectFilesApi(projectId),
      ])
      setProject(proj)
      setFiles(fileList)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const updateProject = useCallback(async (updates: UpdateProjectInput) => {
    setProject((prev) => prev ? { ...prev, ...updates } : prev)
    try {
      const updated = await updateProjectApi(projectId, updates)
      setProject(updated)
    } catch {
      fetchProject()
    }
  }, [projectId, fetchProject])

  const addFiles = useCallback(async (relativePaths: string[]) => {
    const updatedFiles = await addProjectFilesApi(projectId, relativePaths)
    setFiles(updatedFiles)
  }, [projectId])

  const removeFile = useCallback(async (relativePath: string) => {
    setFiles((prev) => prev.filter((f) => f.relativePath !== relativePath))
    try {
      await removeProjectFileApi(projectId, relativePath)
    } catch {
      fetchProject()
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return { project, files, loading, error, updateProject, addFiles, removeFile, refresh: fetchProject }
}
