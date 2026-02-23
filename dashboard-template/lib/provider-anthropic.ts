// Anthropic-specific streaming helpers for direct provider bypass

interface StreamMessage {
  role: string
  content: unknown
}

export function convertToAnthropicMessages(messages: StreamMessage[]) {
  const system: string[] = []
  const msgs: Array<{ role: string; content: unknown }> = []

  for (const msg of messages) {
    if (msg.role === "system") {
      system.push(typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content))
      continue
    }
    if (msg.role === "user" && Array.isArray(msg.content)) {
      const converted = (msg.content as Array<Record<string, unknown>>).map(
        (part) => {
          if (part.type === "image_url") {
            const url = (part.image_url as { url: string }).url
            const { mediaType, data } = parseDataUrl(url)
            return {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            }
          }
          return part
        },
      )
      msgs.push({ role: "user", content: converted })
    } else {
      msgs.push({ role: msg.role, content: msg.content })
    }
  }

  return { system: system.join("\n\n") || undefined, messages: msgs }
}

function parseDataUrl(url: string): { mediaType: string; data: string } {
  // data:image/jpeg;base64,/9j/4AAQ...
  const match = url.match(/^data:([^;]+);base64,(.+)$/)
  if (match) return { mediaType: match[1], data: match[2] }
  return { mediaType: "image/jpeg", data: url }
}

export async function fetchAnthropic(
  token: string, model: string, messages: StreamMessage[],
): Promise<globalThis.Response> {
  const { system, messages: msgs } = convertToAnthropicMessages(messages)
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      ...(system ? { system } : {}),
      messages: msgs,
    }),
  })
}

export function extractAnthropicContent(parsed: Record<string, unknown>): string | null {
  if (parsed.type === "content_block_delta") {
    const delta = parsed.delta as { text?: string } | undefined
    return delta?.text || null
  }
  return null
}
