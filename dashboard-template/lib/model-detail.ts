// Builds model detail — resolves which agents, cron jobs, topics, and heartbeat use a given model

import { readFile } from "fs/promises"
import { readConfig } from "./gateway"
import { providerFromId } from "./model-utils"
import { AGENT_MODEL_TIERS, TOPIC_AGENT_DEFAULTS } from "./agent-personas"
import { CONTEXTUAL_AGENTS, SUB_AGENTS } from "./architecture-agents"
import type { ModelDetail, ModelDetailAgent, ModelDetailCronJob } from "@/types/index"

export async function buildModelDetail(modelId: string): Promise<ModelDetail> {
  const config = await readConfig()
  const defaults = config.agents?.defaults
  const modelConfig = defaults?.model as Record<string, unknown> | undefined
  const modelsCatalog = (defaults?.models || {}) as Record<string, { alias?: string }>
  const heartbeat = defaults?.heartbeat as Record<string, unknown> | undefined

  const primary = modelConfig?.primary as string | undefined
  const heartbeatModel = heartbeat?.model as string | undefined
  const alias = modelsCatalog[modelId]?.alias || modelId.split("/").pop()?.split("-")[0] || modelId

  // Build alias → modelId reverse map
  const aliasMap: Record<string, string> = {}
  for (const [id, entry] of Object.entries(modelsCatalog)) {
    if (entry.alias) aliasMap[entry.alias] = id
  }
  // "default" alias resolves to primary
  if (primary) aliasMap["default"] = primary

  // Role
  let role = "Catalog"
  if (modelId === primary) role = "Primary"
  else if ((modelConfig?.fallbacks as string[] | undefined)?.includes(modelId)) role = "Fallback"
  if (modelId === heartbeatModel) role += " + Heartbeat"

  // Agents using this model tier
  const allAgents = [...CONTEXTUAL_AGENTS, ...SUB_AGENTS]
  const agents: ModelDetailAgent[] = []
  for (const [agentId, tieredModel] of Object.entries(AGENT_MODEL_TIERS)) {
    if (tieredModel === modelId) {
      const agent = allAgents.find((a) => a.id === agentId)
      agents.push({ id: agentId, name: agent?.name || agentId })
    }
  }
  // Agents without explicit tiers use the primary model
  if (modelId === primary) {
    for (const agent of allAgents) {
      if (!AGENT_MODEL_TIERS[agent.id] && !agents.some((a) => a.id === agent.id)) {
        agents.push({ id: agent.id, name: agent.name })
      }
    }
  }

  // Cron jobs using this model
  const cronJobs: ModelDetailCronJob[] = []
  try {
    const raw = await readFile("/root/.openclaw/cron/jobs.json", "utf-8")
    const parsed = JSON.parse(raw)
    const jobs = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.jobs) ? parsed.jobs : [])
    for (const job of jobs) {
      const jobModel = job.payload?.model || job.model || "default"
      const resolvedId = aliasMap[jobModel] || jobModel
      if (resolvedId === modelId) {
        cronJobs.push({ name: job.name || job.id, schedule: job.schedule || "" })
      }
    }
  } catch (error) { console.error("Failed to read cron jobs for model detail:", error) }

  // Topics routing to this model (via default agent → model tier)
  const topics: string[] = []
  for (const [topic, agentId] of Object.entries(TOPIC_AGENT_DEFAULTS)) {
    const tieredModel = AGENT_MODEL_TIERS[agentId]
    if (tieredModel === modelId) topics.push(topic)
    else if (!tieredModel && modelId === primary) topics.push(topic)
  }
  // General topic uses primary (via LLM orchestrator)
  if (modelId === primary) topics.push("general")

  return {
    id: modelId,
    alias,
    provider: providerFromId(modelId),
    role,
    agents,
    cronJobs,
    topics,
    isHeartbeat: modelId === heartbeatModel,
  }
}
