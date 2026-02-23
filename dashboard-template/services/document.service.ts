import { apiFetch } from "@/lib/api-client"
import type { Document, DocumentCategory, DocumentFolder } from "@/types"

const BASE_URL = "/api/documents"

export interface DocumentFolderCounts {
  folderCounts: { general: number; system: number }
  projectCounts: Array<{ projectId: string; name: string; count: number }>
  agentCounts: Array<{ agentId: string; count: number }>
}

export async function getDocumentsApi(opts?: {
  category?: string; search?: string; folder?: string
  projectId?: string; agentId?: string; limit?: number; offset?: number
}): Promise<{ documents: Document[]; total: number }> {
  const params = new URLSearchParams()
  if (opts?.category) params.set("category", opts.category)
  if (opts?.search) params.set("search", opts.search)
  if (opts?.folder) params.set("folder", opts.folder)
  if (opts?.projectId) params.set("projectId", opts.projectId)
  if (opts?.agentId) params.set("agentId", opts.agentId)
  if (opts?.limit) params.set("limit", String(opts.limit))
  if (opts?.offset) params.set("offset", String(opts.offset))

  const res = await apiFetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Documents fetch failed: ${res.status}`)
  return res.json()
}

export async function getDocumentCountsApi(): Promise<DocumentFolderCounts> {
  const res = await apiFetch(`${BASE_URL}?counts=true`)
  if (!res.ok) throw new Error("Failed to fetch document counts")
  return res.json()
}

export async function createDocumentApi(input: {
  category?: DocumentCategory; title: string; content?: string; tags?: string
  source?: string; folder?: DocumentFolder; projectId?: string; agentId?: string
}): Promise<Document> {
  const res = await apiFetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create document")
  const data = await res.json()
  return data.document
}

export async function updateDocumentApi(
  id: string,
  updates: Partial<Pick<Document, "category" | "title" | "content" | "tags" | "folder" | "projectId" | "agentId">>
): Promise<Document> {
  const res = await apiFetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update document")
  const data = await res.json()
  return data.document
}

export async function deleteDocumentApi(id: string): Promise<void> {
  const res = await apiFetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete document")
}
