// Direct provider streaming — bypasses gateway for image messages

import { getProviderToken } from "@/lib/provider-auth"
import { modelNameForProvider } from "@/lib/model-utils"
import { fetchAnthropic, extractAnthropicContent } from "@/lib/provider-anthropic"
import { fetchGoogle, fetchOpenAI, extractOpenAIContent } from "@/lib/provider-openai"

interface StreamMessage {
  role: string
  content: unknown
}

interface PostProcessResult {
  events: string[]
  chatContent: string
}

interface DirectStreamOptions {
  messages: StreamMessage[]
  model: string
  provider: "anthropic" | "openai-codex" | "google-gemini-cli"
  initialMeta?: Record<string, unknown>
  onComplete?: (chatContent: string) => void
  postProcess?: (fullResponse: string) => PostProcessResult
}

export async function createDirectProviderStream(
  options: DirectStreamOptions,
): Promise<Response> {
  const { provider, model, messages, initialMeta, onComplete, postProcess } =
    options
  const token = getProviderToken(provider)
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Provider credentials unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  const modelName = modelNameForProvider(model)

  const providerFetchers: Record<
    DirectStreamOptions["provider"],
    () => Promise<Response>
  > = {
    anthropic: () => fetchAnthropic(token, modelName, messages),
    "google-gemini-cli": () => fetchGoogle(token, modelName, messages),
    "openai-codex": () => fetchOpenAI(token, modelName, messages),
  }

  const res = await providerFetchers[provider]()

  if (!res.ok) {
    const text = await res.text()
    console.error(`Direct ${provider} error ${res.status}:`, text)
    return new Response(
      JSON.stringify({ error: "Provider temporarily unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!res.body) {
    return new Response(
      JSON.stringify({ error: "No response body from provider" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }

  return buildSSEResponse(res.body, provider, initialMeta, onComplete, postProcess)
}

// --- Shared SSE relay ---

function buildSSEResponse(
  body: ReadableStream<Uint8Array>,
  provider: "anthropic" | "openai-codex" | "google-gemini-cli",
  initialMeta?: Record<string, unknown>,
  onComplete?: (chatContent: string) => void,
  postProcess?: (fullResponse: string) => PostProcessResult,
): Response {
  let fullResponse = ""
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      if (initialMeta) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ meta: initialMeta })}\n\n`,
          ),
        )
      }

      reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6)
            if (data === "[DONE]") {
              controller.enqueue(
                new TextEncoder().encode("data: [DONE]\n\n"),
              )
              continue
            }
            try {
              const content = provider === "anthropic"
                ? extractAnthropicContent(JSON.parse(data))
                : extractOpenAIContent(JSON.parse(data))
              if (content) {
                fullResponse += content
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ content })}\n\n`,
                  ),
                )
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        if (fullResponse) {
          const result = postProcess?.(fullResponse) ?? {
            events: [],
            chatContent: fullResponse,
          }
          onComplete?.(result.chatContent)
          for (const evt of result.events) {
            try {
              controller.enqueue(new TextEncoder().encode(evt))
            } catch {
              /* stream closed */
            }
          }
        }
        try {
          controller.close()
        } catch {
          /* stream already cancelled */
        }
      }
    },
    cancel() {
      reader?.cancel()
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
