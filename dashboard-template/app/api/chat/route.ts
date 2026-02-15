import { NextRequest } from "next/server"

import { saveChatMessage } from "@/lib/db-chat"
import { postProcessChatResponse } from "@/lib/chat-post-process"
import { createGatewayStream } from "@/lib/chat-stream"

export async function POST(req: NextRequest) {
  try {
    const { message, topic, sessionId, history, model, attachments } = await req.json()
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const chatTopic = topic || "general"
    const sid = sessionId || "default"
    const sessionKey = `command-centre-${chatTopic}-${sid}`

    // Save user message to DB
    saveChatMessage({ topic: chatTopic, sessionId: sid, role: "user", content: message })

    // Build user message content — multipart if attachments present
    type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    let userContent: string | ContentPart[] = message
    if (attachments?.length) {
      const parts: ContentPart[] = []
      if (message) parts.push({ type: "text", text: message })
      for (const att of attachments) {
        parts.push({ type: "image_url", image_url: { url: att.dataUrl } })
      }
      userContent = parts
    }

    const messages = [
      ...(history || []),
      { role: "user" as const, content: userContent },
    ]

    return createGatewayStream({
      messages,
      sessionKey,
      model,
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
