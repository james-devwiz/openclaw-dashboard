// OpenAI and Google (Gemini) streaming helpers for direct provider bypass
// Google uses the OpenAI-compatible endpoint, so shares the same format

interface StreamMessage {
  role: string
  content: unknown
}

export async function fetchGoogle(
  token: string, model: string, messages: StreamMessage[],
): Promise<globalThis.Response> {
  return fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ model, stream: true, messages }),
    },
  )
}

export async function fetchOpenAI(
  token: string, model: string, messages: StreamMessage[],
): Promise<globalThis.Response> {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model, stream: true, messages }),
  })
}

export function extractOpenAIContent(parsed: Record<string, unknown>): string | null {
  const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined
  return choices?.[0]?.delta?.content || null
}
