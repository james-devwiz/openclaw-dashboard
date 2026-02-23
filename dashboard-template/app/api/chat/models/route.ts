import { readFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"

import { labelFromId, providerFromId } from "@/lib/model-utils"
import { getDisabledModelIds } from "@/lib/db-models"

interface ModelEntry {
  id: string
  alias: string
  label: string
  provider: string
}

export async function GET() {
  try {
    const configPath = join(homedir(), ".openclaw", "openclaw.json")
    const raw = await readFile(configPath, "utf-8")
    const config = JSON.parse(raw)

    const agentConfig = config.agents?.defaults || {}
    const modelConfig = agentConfig.model || {}
    const primary = typeof modelConfig === "string" ? modelConfig : modelConfig.primary
    const fallbacks: string[] = (typeof modelConfig === "object" && Array.isArray(modelConfig.fallbacks)) ? modelConfig.fallbacks : []
    const modelsCatalog: Record<string, { alias?: string }> = agentConfig.models || {}
    const disabledIds = getDisabledModelIds()

    const seen = new Set<string>()
    const models: ModelEntry[] = []

    const addModel = (id: string) => {
      if (!id || seen.has(id)) return
      if (disabledIds.has(id)) return
      seen.add(id)
      const alias = modelsCatalog[id]?.alias || id.split("/").pop()?.split("-")[0] || id
      models.push({ id, alias, label: labelFromId(id), provider: providerFromId(id) })
    }

    // Ordered: primary first, then fallbacks, then remaining catalog entries
    if (primary) addModel(primary)
    for (const id of fallbacks) addModel(id)
    for (const id of Object.keys(modelsCatalog)) addModel(id)

    return Response.json({ models })
  } catch (error) {
    console.error("Failed to load chat models:", error)
    return Response.json({ models: [] })
  }
}
