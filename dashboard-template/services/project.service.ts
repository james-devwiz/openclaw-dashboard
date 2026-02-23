import { apiFetch } from "@/lib/api-client"
import type { Project, ProjectFile, CreateProjectInput, UpdateProjectInput } from "@/types/index"
import type { ChatSession } from "@/types/index"

const BASE_URL = "/api/projects"

// --- Projects ---

export async function getProjectsApi(): Promise<Project[]> {
  const res = await apiFetch(BASE_URL)
  if (!res.ok) throw new Error(`Projects fetch failed: ${res.status}`)
  const data = await res.json()
  return data.projects || []
}

export async function getProjectApi(id: string): Promise<Project> {
  const res = await apiFetch(`${BASE_URL}/${id}`)
  if (!res.ok) throw new Error(`Project fetch failed: ${res.status}`)
  const data = await res.json()
  return data.project
}

export async function createProjectApi(input: CreateProjectInput): Promise<Project> {
  const res = await apiFetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create project")
  const data = await res.json()
  return data.project
}

export async function updateProjectApi(id: string, updates: UpdateProjectInput): Promise<Project> {
  const res = await apiFetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update project")
  const data = await res.json()
  return data.project
}

export async function deleteProjectApi(id: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete project")
}

// --- Project Files ---

export async function getProjectFilesApi(projectId: string): Promise<ProjectFile[]> {
  const res = await apiFetch(`${BASE_URL}/${projectId}/files`)
  if (!res.ok) throw new Error("Failed to fetch project files")
  const data = await res.json()
  return data.files || []
}

export async function addProjectFilesApi(projectId: string, relativePaths: string[]): Promise<ProjectFile[]> {
  const res = await apiFetch(`${BASE_URL}/${projectId}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ relativePaths }),
  })
  if (!res.ok) throw new Error("Failed to add files")
  const data = await res.json()
  return data.files || []
}

export async function removeProjectFileApi(projectId: string, relativePath: string): Promise<void> {
  const encoded = btoa(relativePath).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const res = await apiFetch(`${BASE_URL}/${projectId}/files?path=${encoded}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to remove file")
}

// --- Project Sessions ---

export async function getProjectSessionsApi(projectId: string): Promise<ChatSession[]> {
  const res = await apiFetch(`${BASE_URL}/${projectId}/sessions`)
  if (!res.ok) throw new Error("Failed to fetch sessions")
  const data = await res.json()
  return data.sessions || []
}

export async function createProjectSessionApi(projectId: string): Promise<ChatSession> {
  const res = await apiFetch(`${BASE_URL}/${projectId}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error("Failed to create session")
  const data = await res.json()
  return data.session
}

export async function renameProjectSessionApi(sessionId: string, title: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/placeholder/sessions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, title }),
  })
  if (!res.ok) throw new Error("Failed to rename session")
}

export async function deleteProjectSessionApi(projectId: string, sessionId: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}/${projectId}/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete session")
}
