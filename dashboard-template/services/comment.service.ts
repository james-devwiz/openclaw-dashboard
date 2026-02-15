import type { Comment } from "@/types/index"

const BASE_URL = "/api/comments"

export async function getCommentsApi(taskId: string): Promise<Comment[]> {
  const res = await fetch(`${BASE_URL}?taskId=${encodeURIComponent(taskId)}`)
  if (!res.ok) throw new Error(`Comments fetch failed: ${res.status}`)
  const data = await res.json()
  return data.comments || []
}

export async function createCommentApi(input: {
  taskId: string
  content: string
  source?: "user" | "openclaw"
}): Promise<Comment> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create comment")
  const data = await res.json()
  return data.comment
}

export async function deleteCommentApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete comment")
}
