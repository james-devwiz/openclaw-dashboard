// AI review helpers — generates review summaries and replies via gateway

import { getDb } from "./db"
import { getComments, createComment } from "./db-comments"

import type { Comment } from "@/types"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""
const MODEL = "openai-codex/gpt-5.1-codex-mini"

interface TaskRow {
  name: string
  description: string
  status: string
  priority: string
  category: string
}

async function callGateway(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
  })

  if (!res.ok) throw new Error(`Gateway error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

export async function generateReviewSummary(taskId: string): Promise<Comment> {
  const db = getDb()
  const task = db.prepare("SELECT name, description, status, priority, category FROM tasks WHERE id = ?")
    .get(taskId) as TaskRow | undefined
  if (!task) throw new Error("Task not found")

  const comments = getComments(taskId)
  const activities = db.prepare(
    "SELECT action, detail, createdAt FROM activities WHERE entityId = ? ORDER BY createdAt DESC LIMIT 10"
  ).all(taskId) as { action: string; detail: string; createdAt: string }[]

  const context = [
    `Task: ${task.name}`,
    task.description ? `Description: ${task.description}` : "",
    `Priority: ${task.priority} | Category: ${task.category}`,
    comments.length ? `\nRecent comments:\n${comments.slice(0, 5).map(c => `- [${c.source}] ${c.content}`).join("\n")}` : "",
    activities.length ? `\nRecent activity:\n${activities.map(a => `- ${a.action}: ${a.detail}`).join("\n")}` : "",
  ].filter(Boolean).join("\n")

  const text = await callGateway([
    { role: "system", content: "You are the AI Assistant. A task has just moved to Needs Review. Summarize what was done and what exactly needs to be approved. Be concise (2-4 sentences). Do not use markdown headers." },
    { role: "user", content: context },
  ])

  return createComment({ taskId, content: text.trim(), source: "openclaw" })
}

export async function generateReviewReply(taskId: string, userMessage: string): Promise<Comment> {
  const db = getDb()
  const task = db.prepare("SELECT name, description, status, priority, category FROM tasks WHERE id = ?")
    .get(taskId) as TaskRow | undefined
  if (!task) throw new Error("Task not found")

  const comments = getComments(taskId)
  const thread = comments.map(c => ({
    role: c.source === "openclaw" ? "assistant" : "user",
    content: c.content,
  }))

  const messages = [
    { role: "system", content: `You are the AI Assistant reviewing the task "${task.name}". The human reviewer has replied. Address their question or feedback concisely (1-3 sentences). Do not use markdown headers.` },
    ...thread,
    { role: "user", content: userMessage },
  ]

  const text = await callGateway(messages)
  return createComment({ taskId, content: text.trim(), source: "openclaw" })
}
