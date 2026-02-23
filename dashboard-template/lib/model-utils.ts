// Shared model label and provider utilities

export const MODEL_LABELS: Record<string, string> = {
  "openai-codex/gpt-5.2": "GPT-5.2",
  "openai-codex/gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
  "openai-codex/gpt-5.3-codex": "GPT-5.3 Codex",
  "openai-codex/gpt-5.3-codex-spark": "GPT-5.3 Spark",
  "google-gemini-cli/gemini-3-pro-preview": "Gemini 3 Pro",
  "google-gemini-cli/gemini-3-flash-preview": "Gemini 3 Flash",
  "anthropic/claude-sonnet-4-5": "Claude Sonnet 4.5",
  "anthropic/claude-sonnet-4-6": "Claude Sonnet 4.6",
  "anthropic/claude-opus-4-6": "Claude Opus 4.6",
  "anthropic/claude-3-5-haiku-20241022": "Claude Haiku 3.5",
  "anthropic/claude-haiku-4-5-20251001": "Claude Haiku 4.5",
  "ollama/qwen2.5:3b": "Qwen 2.5 3B (Local)",
}

export function labelFromId(id: string): string {
  return MODEL_LABELS[id] || id.split("/").pop() || id
}

export function providerFromId(id: string): string {
  if (id.startsWith("openai")) return "OpenAI"
  if (id.startsWith("anthropic")) return "Anthropic"
  if (id.startsWith("google-gemini-cli")) return "Google"
  if (id.startsWith("ollama")) return "Ollama"
  return id.split("/")[0] || "Unknown"
}

export function modelNameForProvider(id: string): string {
  return id.includes("/") ? id.split("/").slice(1).join("/") : id
}

export function providerKeyFromId(id: string): "anthropic" | "openai-codex" | "google-gemini-cli" | null {
  if (id.startsWith("anthropic/")) return "anthropic"
  if (id.startsWith("openai-codex/")) return "openai-codex"
  if (id.startsWith("google-gemini-cli/")) return "google-gemini-cli"
  return null
}
