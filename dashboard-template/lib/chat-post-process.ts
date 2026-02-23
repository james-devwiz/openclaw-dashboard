import type { ChatTopic } from "@/types/index"
import { parseBriefBlock, parseBriefUpdateBlock, parseTaskMarkers, stripMetaBlocks } from "@/lib/chat-prompts"
import { createBrief, updateBrief } from "@/lib/db-briefs"
import { createTask } from "@/lib/db-tasks"

interface PostProcessResult {
  events: string[]
  chatContent: string
}

/**
 * Post-processes a completed chat response for topic-specific side effects:
 * - briefs/reports: saves to briefs table via :::brief markers, updates via :::brief-update
 * - tasks: auto-creates tasks from ---task markers
 * Returns SSE-formatted meta events and the stripped chat content for DB storage.
 */
export function postProcessChatResponse(
  topic: ChatTopic,
  fullResponse: string,
): PostProcessResult {
  const events: string[] = []

  if (topic === "briefs" || topic === "reports") {
    // Check for brief-update first (more specific marker)
    const updateMeta = parseBriefUpdateBlock(fullResponse)
    if (updateMeta) {
      try {
        const brief = updateBrief(updateMeta.id, { content: updateMeta.content })
        if (brief) {
          events.push(
            `data: ${JSON.stringify({ meta: { brief_updated: true, briefId: brief.id, briefType: brief.briefType } })}\n\n`,
          )
        }
      } catch (error) {
        console.error("Failed to update brief from chat:", error)
      }
    } else {
      // Check for new brief creation
      const briefMeta = parseBriefBlock(fullResponse)
      if (briefMeta) {
        try {
          const brief = createBrief({
            briefType: briefMeta.type,
            title: briefMeta.title,
            content: briefMeta.content,
            date: briefMeta.date,
            source: "manual",
          })
          events.push(
            `data: ${JSON.stringify({ meta: { brief_saved: true, briefId: brief.id, briefType: brief.briefType } })}\n\n`,
          )
        } catch (error) {
          console.error("Failed to create brief from chat:", error)
        }
      }
      // No markers = no auto-save (intentional — conversational messages don't create briefs)
    }
  }

  if (topic === "tasks") {
    const taskMetas = parseTaskMarkers(fullResponse)
    if (taskMetas.length > 0) {
      const created: Array<{ id: string; name: string }> = []
      for (const t of taskMetas) {
        try {
          const task = createTask({
            name: t.name,
            priority: t.priority,
            category: t.category,
            source: "Manual",
            status: "Backlog",
          })
          created.push({ id: task.id, name: task.name })
        } catch (error) {
          console.error(`Failed to create task "${t.name}" from chat:`, error)
        }
      }
      if (created.length > 0) {
        events.push(
          `data: ${JSON.stringify({ meta: { tasks_created: created } })}\n\n`,
        )
      }
    }
  }

  return { events, chatContent: stripMetaBlocks(fullResponse) }
}
