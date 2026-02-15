// Shared gateway SSE streaming utility — used by /api/chat and /api/projects/[id]/chat

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

interface StreamMessage {
  role: string
  content: unknown
}

interface PostProcessResult {
  events: string[]
  chatContent: string
}

interface GatewayStreamOptions {
  messages: StreamMessage[]
  sessionKey: string
  model?: string
  onComplete?: (chatContent: string) => void
  postProcess?: (fullResponse: string) => PostProcessResult
}

export async function createGatewayStream(options: GatewayStreamOptions): Promise<Response> {
  const { messages, sessionKey, model, onComplete, postProcess } = options

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "x-openclaw-agent-id": "main",
      "x-openclaw-session-key": sessionKey,
    },
    body: JSON.stringify({
      model: model || "openclaw:main",
      stream: true,
      messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(
      JSON.stringify({ error: `Gateway error: ${res.status} ${text}` }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!res.body) {
    return new Response(
      JSON.stringify({ error: "No response body from gateway" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  let fullResponse = ""
  let gatewayReader: ReadableStreamDefaultReader<Uint8Array> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      gatewayReader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await gatewayReader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6)
            if (data === "[DONE]") {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
              continue
            }
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullResponse += content
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`),
                )
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        if (fullResponse) {
          const result = postProcess?.(fullResponse) ?? { events: [], chatContent: fullResponse }
          onComplete?.(result.chatContent)
          for (const evt of result.events) {
            try { controller.enqueue(new TextEncoder().encode(evt)) } catch { /* stream closed */ }
          }
        }
        try { controller.close() } catch { /* stream already cancelled */ }
      }
    },
    cancel() {
      gatewayReader?.cancel()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
