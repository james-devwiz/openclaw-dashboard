// LinkedIn engagement fetching — post reactions, comments, profile viewers

import { getUnipile, getAccountId } from "./unipile"

import type { ProspectCandidate } from "./linkedin-prospect-filters"

/* eslint-disable @typescript-eslint/no-explicit-any */

const DSN = process.env.UNIPILE_DSN || ""
const API_KEY = process.env.UNIPILE_API_KEY || ""

async function unipileRest(path: string, method = "GET", body?: any): Promise<any> {
  const res = await fetch(`https://${DSN}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error(`Unipile ${path}: ${res.status}`)
  return res.json()
}

export function getYesterdayAEST(): { start: string; end: string } {
  const now = new Date()
  const aest = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }))
  aest.setDate(aest.getDate() - 1)
  const y = aest.getFullYear(), m = String(aest.getMonth() + 1).padStart(2, "0"), d = String(aest.getDate()).padStart(2, "0")
  return { start: `${y}-${m}-${d}T00:00:00`, end: `${y}-${m}-${d}T23:59:59` }
}

export function extractIdentifier(url: string): string {
  const match = url.match(/\/in\/([^/?]+)/)
  return match ? match[1] : ""
}

interface FetchPostResult {
  postId: string | null
  postTitle: string
  apiCallsUsed: number
  warnings: string[]
}

/** Fetch yesterday's post and return its ID */
export async function fetchYesterdayPost(ownId: string): Promise<FetchPostResult> {
  const client = getUnipile()
  const accountId = getAccountId()
  const { start, end } = getYesterdayAEST()
  let apiCallsUsed = 0
  const warnings: string[] = []

  try {
    const postsRes: any = await client.users.getAllPosts({
      account_id: accountId, identifier: ownId, limit: 5,
    })
    apiCallsUsed++
    const posts = postsRes?.items || []
    const yesterdayPost = posts.find((p: any) => {
      const created = p.created_at || p.date || ""
      return created >= start && created <= end
    })
    if (yesterdayPost) {
      return { postId: yesterdayPost.id, postTitle: (yesterdayPost.text || "").slice(0, 80), apiCallsUsed, warnings }
    }
    warnings.push("No post found for yesterday -- skipping reactions/comments")
  } catch (err: any) {
    warnings.push(`Posts fetch failed: ${err.message}`)
    apiCallsUsed++
  }

  return { postId: null, postTitle: "", apiCallsUsed, warnings }
}

interface EngagementResult {
  candidates: Map<string, ProspectCandidate>
  apiCallsUsed: number
  warnings: string[]
}

/** Fetch reactions, comments, and profile viewers */
export async function fetchEngagementCandidates(postId: string | null): Promise<EngagementResult> {
  const client = getUnipile()
  const accountId = getAccountId()
  const candidates = new Map<string, ProspectCandidate>()
  let apiCallsUsed = 0
  const warnings: string[] = []

  if (postId) {
    // Reactions (REST)
    try {
      const reactionsRes = await unipileRest(`/posts/${postId}/reactions`)
      apiCallsUsed++
      for (const r of reactionsRes?.items || []) {
        const url = r.profile_url || r.author_details?.profile_url || ""
        if (!url || candidates.has(url)) continue
        candidates.set(url, {
          providerId: r.provider_id || r.author_details?.provider_id || "",
          name: r.name || r.author_details?.name || "",
          headline: r.headline || r.author_details?.headline || "",
          profileUrl: url,
          networkDistance: r.network_distance || r.author_details?.network_distance || "",
          engagementType: "reaction",
          engagementDetail: r.reaction_type || "LIKE",
        })
      }
    } catch (err: any) {
      warnings.push(`Reactions fetch failed: ${err.message}`)
    }

    // Comments (SDK)
    try {
      const commentsRes: any = await client.users.getAllPostComments({
        account_id: accountId, post_id: postId,
      })
      apiCallsUsed++
      for (const c of commentsRes?.items || []) {
        const ad = c.author_details || {}
        const url = ad.profile_url || ""
        if (!url || candidates.has(url)) continue
        candidates.set(url, {
          providerId: ad.provider_id || "",
          name: ad.name || "",
          headline: ad.headline || "",
          profileUrl: url,
          networkDistance: ad.network_distance || "",
          engagementType: "comment",
          engagementDetail: (c.text || "").slice(0, 200),
        })
      }
    } catch (err: any) {
      warnings.push(`Comments fetch failed: ${err.message}`)
    }
  }

  // Profile viewers (fragile, fail silently)
  try {
    const viewersRes = await unipileRest("/linkedin", "POST", {
      account_id: accountId,
      url: "https://www.linkedin.com/me/profile-views/",
    })
    apiCallsUsed++
    for (const v of viewersRes?.items || viewersRes?.data || []) {
      const url = v.profile_url || v.profileUrl || ""
      if (!url || candidates.has(url)) continue
      candidates.set(url, {
        providerId: v.provider_id || "",
        name: v.name || "",
        headline: v.headline || "",
        profileUrl: url,
        networkDistance: v.network_distance || "SECOND_DEGREE",
        engagementType: "profile_view",
        engagementDetail: "",
      })
    }
  } catch (err: any) {
    warnings.push(`Profile viewers failed (expected): ${err.message}`)
  }

  return { candidates, apiCallsUsed, warnings }
}
