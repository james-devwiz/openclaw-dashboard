import { NextResponse } from "next/server"

import { readConfig, runCmd } from "@/lib/gateway"
import { labelFromId, providerFromId } from "@/lib/model-utils"
import { getDisabledModelIds } from "@/lib/db-models"
import { BUSINESSES, AGENTS } from "@/lib/architecture-config"
import type { SkillInfo, AgentWithLiveData, ArchitectureData, ModelInfo } from "@/types/index"

function parseSkillsJson(output: string): SkillInfo[] {
  try {
    const data = JSON.parse(output)
    return (data.skills || []).map((s: Record<string, unknown>) => {
      const disabled = !!s.disabled
      const missing = s.missing as Record<string, string[]> | undefined
      return {
        name: s.name as string,
        emoji: s.emoji as string,
        status: disabled ? "disabled" : (s.eligible ? "ready" : "missing"),
        description: (s.description as string) || "",
        source: (s.source as string) || "unknown",
        homepage: (s.homepage as string) || undefined,
        disabled,
        install: [],
        missing: {
          bins: missing?.bins || [],
          anyBins: missing?.anyBins || [],
          env: missing?.env || [],
          config: missing?.config || [],
          os: missing?.os || [],
        },
      }
    })
  } catch (error) {
    console.error("Failed to build skills list:", error)
    return []
  }
}

function buildModels(config: ReturnType<typeof Object>): ModelInfo[] {
  const agents = (config as Record<string, unknown>).agents as Record<string, unknown> | undefined
  const defaults = agents?.defaults as Record<string, unknown> | undefined
  const modelConfig = defaults?.model as Record<string, unknown> | undefined
  const modelsCatalog = (defaults?.models || {}) as Record<string, { alias?: string }>
  const heartbeat = defaults?.heartbeat as Record<string, unknown> | undefined

  const primary = typeof modelConfig === "string" ? modelConfig : (modelConfig?.primary as string | undefined)
  const fallbacks = (modelConfig?.fallbacks as string[]) || []
  const heartbeatModel = heartbeat?.model as string | undefined
  const disabledIds = getDisabledModelIds()

  const seen = new Set<string>()
  const models: ModelInfo[] = []

  const addModel = (id: string) => {
    if (!id || seen.has(id)) return
    seen.add(id)
    const entry = modelsCatalog[id]
    models.push({
      id,
      alias: entry?.alias || id.split("/").pop()?.split("-")[0] || id,
      label: labelFromId(id),
      provider: providerFromId(id),
      isPrimary: id === primary,
      isFallback: fallbacks.includes(id),
      isHeartbeat: id === heartbeatModel,
      disabled: disabledIds.has(id),
    })
  }

  if (primary) addModel(primary)
  for (const id of Object.keys(modelsCatalog)) addModel(id)

  return models
}

export async function GET() {
  try {
    const [config, skillsOutput] = await Promise.all([
      readConfig(),
      runCmd("openclaw", ["skills", "list", "--json"], 10000),
    ])

    const skills = parseSkillsJson(skillsOutput)
    const readyCount = skills.filter((s) => s.status === "ready").length

    const agentsDefaults = config.agents?.defaults
    const hb = agentsDefaults?.heartbeat

    let heartbeatInterval = 0
    if (hb?.every) {
      const match = hb.every.match(/^(\d+)m$/)
      if (match) heartbeatInterval = parseInt(match[1])
    }

    const agentsWithLive: AgentWithLiveData[] = AGENTS.map((agent) => ({
      ...agent,
      live: {
        model: agentsDefaults?.model?.primary || "unknown",
        fallbacks: agentsDefaults?.model?.fallbacks || [],
        heartbeat: { enabled: !!hb?.every, interval: heartbeatInterval },
      },
      readySkillCount: readyCount,
      totalSkillCount: skills.length,
    }))

    const models = buildModels(config)

    const data: ArchitectureData = {
      agents: agentsWithLive,
      skills,
      businesses: BUSINESSES,
      models,
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Architecture API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch architecture data" },
      { status: 500 }
    )
  }
}
