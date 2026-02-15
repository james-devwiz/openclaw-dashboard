import { NextRequest, NextResponse } from "next/server"
import { getGoals } from "@/lib/db-goals"
import { getTasks } from "@/lib/db-tasks"
import { getContent } from "@/lib/db-content"
import { getApprovals } from "@/lib/db-approvals"
import { searchWorkspaceFiles } from "@/lib/workspace"
import type { SearchResult } from "@/types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.toLowerCase()

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const results: SearchResult[] = []

  const goals = getGoals().filter(
    (g) => g.name.toLowerCase().includes(query) || g.description.toLowerCase().includes(query)
  )
  for (const g of goals) {
    results.push({ type: "goal", id: g.id, title: g.name, subtitle: `${g.category} — ${g.status}`, href: "/goals" })
  }

  const tasks = getTasks().filter(
    (t) => t.name.toLowerCase().includes(query) || (t.description?.toLowerCase().includes(query))
  )
  for (const t of tasks) {
    results.push({ type: "task", id: t.id, title: t.name, subtitle: `${t.status} — ${t.priority}`, href: "/goals" })
  }

  const content = getContent().filter(
    (c) => c.title.toLowerCase().includes(query) || c.topic.toLowerCase().includes(query)
  )
  for (const c of content) {
    results.push({ type: "content", id: c.id, title: c.title, subtitle: `${c.contentType} — ${c.stage}`, href: "/content" })
  }

  const approvals = getApprovals().filter(
    (a) => a.title.toLowerCase().includes(query) || a.context.toLowerCase().includes(query)
  )
  for (const a of approvals) {
    results.push({ type: "approval", id: a.id, title: a.title, subtitle: `${a.category} — ${a.status}`, href: "/approvals" })
  }

  try {
    const memoryItems = await searchWorkspaceFiles(query)
    for (const m of memoryItems.slice(0, 5)) {
      results.push({ type: "memory", id: m.id, title: m.title, subtitle: m.category, href: "/memory" })
    }
  } catch {
    // workspace may not exist locally
  }

  return NextResponse.json({ results: results.slice(0, 20) })
}
