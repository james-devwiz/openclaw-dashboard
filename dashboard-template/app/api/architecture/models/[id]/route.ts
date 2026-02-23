import { NextResponse } from "next/server"

import { readConfig, writeConfig, restartGateway } from "@/lib/gateway"
import { setModelDisabled } from "@/lib/db-models"

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: RouteCtx) {
  const { id: rawId } = await params
  const modelId = decodeURIComponent(rawId)

  try {
    const { enabled } = await req.json() as { enabled: boolean }
    const config = await readConfig()

    const agents = config.agents?.defaults
    const primary = typeof agents?.model === "string"
      ? agents.model
      : agents?.model?.primary

    if (!enabled && modelId === primary) {
      return NextResponse.json(
        { error: "Cannot disable the primary model" },
        { status: 400 }
      )
    }

    // Persist disabled state in SQLite (not openclaw.json)
    setModelDisabled(modelId, !enabled)

    // When disabling, only remove from fallbacks (keep model in catalog)
    if (!enabled) {
      const model = config.agents?.defaults?.model as Record<string, unknown> | undefined
      if (model?.fallbacks && Array.isArray(model.fallbacks)) {
        model.fallbacks = (model.fallbacks as string[]).filter(id => id !== modelId)
        await writeConfig(config)
        await restartGateway()
      }
    } else {
      // When enabling, restore to fallbacks if not already present and not primary
      if (!config.agents) config.agents = {}
      if (!config.agents.defaults) config.agents.defaults = {}
      if (!config.agents.defaults.models) config.agents.defaults.models = {}

      // Ensure catalog entry exists
      if (!config.agents.defaults.models[modelId]) {
        const shortAlias = modelId.split("/").pop()?.split("-")[0] || modelId
        config.agents.defaults.models[modelId] = { alias: shortAlias }
      }

      // Add to fallbacks if not primary and not already there
      const model = config.agents.defaults.model as Record<string, unknown> | undefined
      if (model && modelId !== primary) {
        if (!Array.isArray(model.fallbacks)) model.fallbacks = []
        if (!(model.fallbacks as string[]).includes(modelId)) {
          (model.fallbacks as string[]).push(modelId)
        }
      }

      await writeConfig(config)
      await restartGateway()
    }

    return NextResponse.json({ id: modelId, disabled: !enabled })
  } catch (err) {
    console.error("Model toggle error:", err)
    return NextResponse.json(
      { error: "Failed to toggle model" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: RouteCtx) {
  const { id: rawId } = await params
  const modelId = decodeURIComponent(rawId)

  try {
    const { action } = await req.json() as { action: string }
    if (action !== "make-primary") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    const config = await readConfig()
    if (!config.agents?.defaults?.model) {
      return NextResponse.json({ error: "No model config found" }, { status: 500 })
    }

    const model = config.agents.defaults.model as Record<string, unknown>
    const oldPrimary = model.primary as string
    if (modelId === oldPrimary) {
      return NextResponse.json({ error: "Already the primary model" }, { status: 400 })
    }

    // Check not disabled
    const { getDisabledModelIds } = await import("@/lib/db-models")
    if (getDisabledModelIds().has(modelId)) {
      return NextResponse.json({ error: "Cannot make a disabled model primary" }, { status: 400 })
    }

    // Set new primary
    model.primary = modelId

    // Remove new primary from fallbacks
    if (Array.isArray(model.fallbacks)) {
      model.fallbacks = (model.fallbacks as string[]).filter(id => id !== modelId)
    } else {
      model.fallbacks = []
    }

    // Add old primary to front of fallbacks
    if (oldPrimary) {
      ;(model.fallbacks as string[]).unshift(oldPrimary)
    }

    await writeConfig(config)
    await restartGateway()

    return NextResponse.json({ id: modelId, primary: true })
  } catch (err) {
    console.error("Make primary error:", err)
    return NextResponse.json(
      { error: "Failed to set primary model" },
      { status: 500 }
    )
  }
}
