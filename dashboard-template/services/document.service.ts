import type { Document, DocumentCategory } from "@/types"

const BASE_URL = "/api/documents"

export async function getDocumentsApi(opts?: {
  category?: string; search?: string; limit?: number; offset?: number
}): Promise<{ documents: Document[]; total: number }> {
  const params = new URLSearchParams()
  if (opts?.category) params.set("category", opts.category)
  if (opts?.search) params.set("search", opts.search)
  if (opts?.limit) params.set("limit", String(opts.limit))
  if (opts?.offset) params.set("offset", String(opts.offset))

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Documents fetch failed: ${res.status}`)
  return res.json()
}

export async function createDocumentApi(input: {
  category?: DocumentCategory
  title: string
  content?: string
  tags?: string
  source?: string
}): Promise<Document> {
  const res = await fetch(BASE_URL, {
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
  updates: Partial<Pick<Document, "category" | "title" | "content" | "tags">>
): Promise<Document> {
  const res = await fetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update document")
  const data = await res.json()
  return data.document
}

export async function deleteDocumentApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete document")
}
