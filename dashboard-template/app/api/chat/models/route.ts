import { readFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"

interface ModelEntry {
  id: string
  alias: string
  label: string
  provider: string
}

function labelFromId(id: string): string {
  const map: Record<string, string> = {
    "openai-codex/gpt-5.2": "GPT-5.2",
    "anthropic/claude-sonnet-4-5": "Claude Sonnet 4.5",
    "anthropic/claude-opus-4-6": "Claude Opus 4.6",
  }
  return map[id] || id.split("/").pop() || id
}

function providerFromId(id: string): string {
  if (id.startsWith("openai")) return "OpenAI"
  if (id.startsWith("anthropic")) return "Anthropic"
  return id.split("/")[0] || "Unknown"
}

export async function GET() {
  try {
    const configPath = join(homedir(), ".openclaw", "openclaw.json")
    const raw = await readFile(configPath, "utf-8")
    const config = JSON.parse(raw)

    const models: ModelEntry[] = []
    const agentConfig = config.agents?.defaults || {}
    const primary = agentConfig.model
    const fallbacks: string[] = agentConfig.fallbackModels || []

    const allModels = primary ? [primary, ...fallbacks] : fallbacks
    for (const id of allModels) {
      const alias = id.split("/").pop()?.split("-")[0] || id
      models.push({ id, alias, label: labelFromId(id), provider: providerFromId(id) })
    }

    return Response.json({ models })
  } catch {
    return Response.json({ models: [] })
  }
}
