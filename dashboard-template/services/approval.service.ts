import { apiFetch } from "@/lib/api-client"
import type { ApprovalItem, ApprovalStatus } from "@/types/index"

const BASE_URL = "/api/approvals"

export async function getApprovalsApi(status?: string): Promise<ApprovalItem[]> {
  const url = status ? `${BASE_URL}?status=${encodeURIComponent(status)}` : BASE_URL
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(`Approvals fetch failed: ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export async function respondToApprovalApi(
  id: string,
  status: ApprovalStatus,
  response: string
): Promise<ApprovalItem> {
  const res = await apiFetch(BASE_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, response }),
  })
  if (!res.ok) throw new Error("Failed to respond to approval")
  const data = await res.json()
  return data.item
}

export async function reviseApprovalApi(id: string, feedback: string): Promise<ApprovalItem> {
  const res = await apiFetch(`${BASE_URL}/revise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, feedback }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Revision failed" }))
    throw new Error(data.error || "Failed to revise approval")
  }
  const data = await res.json()
  return data.item
}

export async function getPendingCountApi(): Promise<number> {
  const res = await apiFetch(`${BASE_URL}/count`)
  if (!res.ok) return 0
  const data = await res.json()
  return data.count || 0
}
