import { NextResponse } from "next/server"

import { readConfig, runCommand } from "@/lib/gateway"
import { BUSINESSES, AGENTS } from "@/lib/architecture-config"
import type { SkillInfo, AgentWithLiveData, ArchitectureData } from "@/types/index"

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
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const [config, skillsOutput] = await Promise.all([
      readConfig(),
      runCommand("openclaw skills list --json 2>&1", 10000),
    ])

    const skills = parseSkillsJson(skillsOutput)
    const readyCount = skills.filter((s) => s.status === "ready").length

    const agents = config.agents?.defaults
    const hb = agents?.heartbeat

    let heartbeatInterval = 0
    if (hb?.every) {
      const match = hb.every.match(/^(\d+)m$/)
      if (match) heartbeatInterval = parseInt(match[1])
    }

    const agentsWithLive: AgentWithLiveData[] = AGENTS.map((agent) => ({
      ...agent,
      live: {
        model: agents?.model?.primary || "unknown",
        fallbacks: agents?.model?.fallbacks || [],
        heartbeat: { enabled: !!hb?.every, interval: heartbeatInterval },
      },
      readySkillCount: readyCount,
      totalSkillCount: skills.length,
    }))

    const data: ArchitectureData = {
      agents: agentsWithLive,
      skills,
      businesses: BUSINESSES,
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
