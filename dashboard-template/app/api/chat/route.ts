import { NextRequest } from "next/server"

import { saveChatMessage } from "@/lib/db-chat"
import { postProcessChatResponse } from "@/lib/chat-post-process"
import { createSmartStream } from "@/lib/chat-stream"

export async function POST(req: NextRequest) {
  try {
    const { message, topic, sessionId, history, model, attachments, agentId, agentName } = await req.json()
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0
    if (!message && !hasAttachments) {
      return new Response(JSON.stringify({ error: "Message or attachments required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const chatTopic = topic || "general"
    const sid = sessionId || "default"
    const sessionKey = `command-centre-${chatTopic}-${sid}`
    const textContent = message || "[file(s) attached]"

    // Save attachment metadata (name + type only, no file data)
    const attachmentsMeta = hasAttachments
      ? JSON.stringify(attachments.map((a: { name: string; type: string }) => ({ name: a.name, type: a.type })))
      : ""

    saveChatMessage({ topic: chatTopic, sessionId: sid, role: "user", content: textContent, attachments: attachmentsMeta })

    // Build user message content — only raster images as image_url
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
      // If no image parts were added, include text describing attachments
      if (parts.length === 0) {
        const names = attachments.map((a: { name: string }) => a.name).join(", ")
        parts.push({ type: "text", text: `${message || ""}\n\n[Attached files: ${names}]`.trim() })
      }
      userContent = parts
    }

    const messages = [
      ...(history || []),
      { role: "user" as const, content: userContent },
    ]

    return createSmartStream({
      messages,
      sessionKey,
      model,
      initialMeta: agentId ? { agentId, agentName: agentName || agentId } : undefined,
      onComplete: (fullResponse) => {
        saveChatMessage({ topic: chatTopic, sessionId: sid, role: "assistant", content: fullResponse })
      },
      postProcess: (fullResponse) => postProcessChatResponse(chatTopic, fullResponse),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: `Chat API error: ${msg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
