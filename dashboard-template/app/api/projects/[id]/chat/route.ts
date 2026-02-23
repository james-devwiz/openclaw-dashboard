import { NextRequest } from "next/server"
import { getProject, getProjectFiles } from "@/lib/db-projects"
import { saveChatMessage } from "@/lib/db-chat"
import { readWorkspaceFile } from "@/lib/workspace"
import { createSmartStream } from "@/lib/chat-stream"

const CHAR_BUDGET = 100_000

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const { message, sessionId, history, model, attachments } = await req.json()
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0

    if (!message && !hasAttachments) {
      return new Response(JSON.stringify({ error: "Message or attachments required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      })
    }

    const project = getProject(projectId)
    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      })
    }

    const sid = sessionId || "default"
    const textContent = message || "[file(s) attached]"

    // Save attachment metadata (name + type only)
    const attachmentsMeta = hasAttachments
      ? JSON.stringify(attachments.map((a: { name: string; type: string }) => ({ name: a.name, type: a.type })))
      : ""

    saveChatMessage({ topic: "project", sessionId: sid, role: "user", content: textContent, attachments: attachmentsMeta })

    // Build context from project instructions + linked files
    const contextParts: string[] = []
    let truncated = false

    if (project.instructions?.trim()) {
      contextParts.push(
        `<project-instructions>\n${project.instructions}\n</project-instructions>`
      )
    }

    const linkedFiles = getProjectFiles(projectId)
    let totalChars = contextParts.join("").length
    const fileSections: string[] = []

    for (const file of linkedFiles) {
      const item = await readWorkspaceFile(file.relativePath)
      if (!item) continue

      const section = `<file path="${file.relativePath}">\n${item.content}\n</file>`
      if (totalChars + section.length > CHAR_BUDGET) {
        const remaining = CHAR_BUDGET - totalChars
        if (remaining > 200) {
          fileSections.push(
            `<file path="${file.relativePath}" truncated="true">\n` +
            `${item.content.slice(0, remaining)}\n[...truncated]\n</file>`
          )
        }
        truncated = true
        break
      }
      fileSections.push(section)
      totalChars += section.length
    }

    if (fileSections.length > 0) {
      contextParts.push(
        `<knowledge-base>\n${fileSections.join("\n\n")}\n</knowledge-base>`
      )
    }

    // Build user content — only raster images as image_url
    const RASTER_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
    type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    let userContent: string | ContentPart[] = textContent
    if (hasAttachments) {
      const parts: ContentPart[] = []
      if (message) parts.push({ type: "text", text: message })
      for (const att of attachments) {
        if (RASTER_TYPES.has(att.type)) {
          parts.push({ type: "image_url", image_url: { url: att.dataUrl } })
        }
      }
      if (parts.length === 0) {
        const names = attachments.map((a: { name: string }) => a.name).join(", ")
        parts.push({ type: "text", text: `${message || ""}\n\n[Attached files: ${names}]`.trim() })
      }
      userContent = parts
    }

    // Assemble final messages — system context first, then history, then user
    const systemContent = contextParts.join("\n\n")
    const messages = [
      ...(systemContent ? [{ role: "system", content: systemContent }] : []),
      ...(history || []),
      { role: "user", content: userContent },
    ]

    const sessionKey = `command-centre-project-${projectId}-${sid}`

    const response = await createSmartStream({
      messages,
      sessionKey,
      model,
      onComplete: (fullResponse) => {
        saveChatMessage({ topic: "project", sessionId: sid, role: "assistant", content: fullResponse })
      },
    })

    // Add truncation header if context was cut
    if (truncated) {
      response.headers.set("X-Context-Truncated", "true")
    }

    return response
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: `Project chat error: ${msg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
