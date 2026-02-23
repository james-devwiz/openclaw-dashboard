/**
 * LinkedIn action handlers — pure async functions that call the service layer
 * and return results. State management stays in the useLinkedIn hook.
 */

import {
  updateThreadApi, getMessagesApi, sendMessageApi, getActionsApi,
  executeActionApi, syncLinkedInApi, classifyThreadsApi, scoreThreadApi,
  enrichThreadApi, generateDraftApi, markAsReadApi, fetchPostsApi,
} from "@/services/linkedin.service"

import type { LinkedInThread, LinkedInMessage, LinkedInAction, WampV2Score } from "@/types"

/* ---------- Thread opening / read ---------- */

export async function loadMessages(threadId: string): Promise<LinkedInMessage[]> {
  return getMessagesApi(threadId)
}

export async function markThreadRead(threadId: string): Promise<LinkedInThread> {
  const { thread } = await markAsReadApi(threadId)
  return thread
}

/* ---------- Thread mutations ---------- */

export async function patchThread(
  threadId: string, updates: Record<string, unknown>,
): Promise<LinkedInThread> {
  return updateThreadApi(threadId, updates)
}

export async function sendLinkedInMessage(
  threadId: string, content: string,
): Promise<LinkedInMessage | null> {
  const { message } = await sendMessageApi({ threadId, content })
  return message ?? null
}

/* ---------- Classification ---------- */

export async function classifyAll(): Promise<void> {
  await classifyThreadsApi()
}

export async function classifyByIds(threadIds: string[]): Promise<void> {
  await classifyThreadsApi(threadIds)
}

export async function changeClassification(
  threadId: string, category: string, note: string,
): Promise<LinkedInThread> {
  return updateThreadApi(threadId, {
    category, manualClassification: true, classificationNote: note,
    classifiedAt: new Date().toISOString(),
  })
}

/* ---------- Scoring & Enrichment ---------- */

export async function scoreThread(threadId: string): Promise<WampV2Score | null> {
  try {
    return await scoreThreadApi(threadId)
  } catch (err) {
    console.error("Score thread failed:", err)
    return null
  }
}

export async function enrichThread(threadId: string) {
  try {
    return await enrichThreadApi(threadId)
  } catch (err) {
    console.error("Enrich thread failed:", err)
    return null
  }
}

/* ---------- Drafts & Posts ---------- */

export async function generateDraft(threadId: string, instruction?: string) {
  try {
    const result = await generateDraftApi(threadId, instruction)
    return result.drafts
  } catch (err) {
    console.error("Draft generation failed:", err)
    return []
  }
}

export async function fetchPosts(threadId: string) {
  try {
    return await fetchPostsApi(threadId)
  } catch (err) {
    console.error("Post fetch failed:", err)
    return null
  }
}

/* ---------- Sync ---------- */

export async function syncLinkedIn(): Promise<void> {
  await syncLinkedInApi()
}

/* ---------- Actions ---------- */

export async function loadActions(): Promise<LinkedInAction[]> {
  return getActionsApi()
}

export async function executeAction(actionId: string): Promise<LinkedInAction> {
  const { action } = await executeActionApi(actionId)
  return action
}
