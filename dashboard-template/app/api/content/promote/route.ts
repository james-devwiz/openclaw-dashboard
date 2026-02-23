import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getContentById, setPromotedTask } from "@/lib/db-content"
import { createTask } from "@/lib/db-tasks"
import type { TaskCategory, TaskPriority } from "@/types"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { contentId, category, priority, comment } = await request.json()
    if (!contentId) return NextResponse.json({ error: "contentId required" }, { status: 400 })

    const item = getContentById(contentId)
    if (!item) return NextResponse.json({ error: "Content not found" }, { status: 404 })

    let description = item.topic || item.title
    if (item.researchNotes) description += `\n\n${item.researchNotes}`

    if (comment) {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GATEWAY_TOKEN}`,
            "x-openclaw-agent-id": "main",
          },
          body: JSON.stringify({
            model: "openclaw:main",
            stream: false,
            messages: [
              { role: "system", content: "Write a clear, actionable task description (2-4 paragraphs). Include context, objectives, and suggested next steps. No preamble." },
              { role: "user", content: `Idea: ${item.title}\n\nDescription: ${item.topic}\n\nResearch Notes: ${item.researchNotes || "None"}\n\nUser Comment: ${comment}\n\nWrite a task description.` },
            ],
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const aiDesc = data.choices?.[0]?.message?.content
          if (aiDesc) description = aiDesc
        }
      } catch (error) { console.error("AI task description generation failed:", error) }
    }

    const task = createTask({
      name: item.title,
      description,
      category: (category as TaskCategory) || "Personal",
      priority: (priority as TaskPriority) || "Medium",
      source: "Manual",
    })

    setPromotedTask(contentId, task.id)
    return NextResponse.json({ taskId: task.id, description }, { status: 201 })
  })
}
