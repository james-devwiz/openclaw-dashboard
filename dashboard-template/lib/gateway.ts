// Gateway client — reads OpenClaw config and system state directly on VPS

import { readFile, writeFile, chmod } from "fs/promises"
import { exec } from "child_process"

const CONFIG_PATH =
  process.env.OPENCLAW_CONFIG_PATH || "/root/.openclaw/openclaw.json"

interface OpenClawConfig {
  gateway?: { port?: number; auth?: { token?: string } }
  agents?: {
    defaults?: {
      model?: { primary?: string; fallbacks?: string[] }
      models?: Record<string, { alias?: string }>
      workspace?: string
      heartbeat?: { every?: string; model?: string; target?: string }
    }
  }
  channels?: Record<string, { enabled?: boolean }>
  plugins?: { entries?: Record<string, { enabled?: boolean }> }
  skills?: { entries?: Record<string, unknown> }
  cron?: {
    enabled?: boolean
  }
}

export async function readConfig(): Promise<OpenClawConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function runCommand(cmd: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs }, (error, stdout) => {
      resolve(error ? "" : stdout.trim())
    })
  })
}

export async function writeConfig(config: OpenClawConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
  await chmod(CONFIG_PATH, 0o600)
}

export async function restartGateway(): Promise<void> {
  await runCommand("systemctl --user restart openclaw-gateway", 10000)
}

export async function getGatewayHealth() {
  const [config, serviceStatus, processCheck] = await Promise.all([
    readConfig(),
    runCommand("systemctl is-active openclaw-gateway 2>/dev/null"),
    runCommand("pgrep -f openclaw-gateway >/dev/null 2>&1 && echo running"),
  ])

  const isRunning = serviceStatus === "active" || processCheck === "running"
  const channels = config.channels || {}

  return {
    status: isRunning ? "healthy" : "down",
    uptime: isRunning ? "running" : "stopped",
    channels: {
      slack: { connected: !!channels.slack?.enabled },
      telegram: { connected: !!channels.telegram?.enabled },
      notion: {
        connected: !!config.skills?.entries?.notion,
      },
    },
  }
}

export async function getGatewayConfig() {
  const config = await readConfig()
  const agents = config.agents?.defaults
  const pluginEntries = config.plugins?.entries || {}
  const skills = config.skills?.entries || {}
  const hb = agents?.heartbeat

  // Read cron jobs from dedicated file (not openclaw.json)
  // File format: { "version": 1, "jobs": [...] }
  let cronJobs: unknown[] = []
  try {
    const cronRaw = await readFile("/root/.openclaw/cron/jobs.json", "utf-8")
    const parsed = JSON.parse(cronRaw)
    cronJobs = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.jobs) ? parsed.jobs : [])
  } catch {
    cronJobs = []
  }

  // Parse heartbeat interval from "60m" format
  let heartbeatInterval = 0
  if (hb?.every) {
    const match = hb.every.match(/^(\d+)m$/)
    if (match) heartbeatInterval = parseInt(match[1])
  }

  return {
    version: await runCommand("openclaw --version 2>/dev/null"),
    agent: "main",
    model: agents?.model?.primary || "unknown",
    fallbacks: agents?.model?.fallbacks || [],
    heartbeat: {
      enabled: !!hb?.every,
      interval: heartbeatInterval,
    },
    cronJobCount: cronJobs.length,
    pluginCount: Object.keys(pluginEntries).length,
    skillCount: Object.keys(skills).length,
  }
}

export async function triggerCronJob(jobName: string) {
  if (!/^[a-z0-9_-]+$/.test(jobName)) {
    throw new Error(`Invalid job name: ${jobName}`)
  }
  const result = await runCommand(
    `openclaw cron trigger ${jobName} 2>&1`,
    15000
  )
  if (!result) {
    throw new Error(`Failed to trigger job: ${jobName}`)
  }
  return { success: true, output: result }
}

export async function triggerHeartbeat() {
  const result = await runCommand(
    `openclaw agent --message "Run your heartbeat checklist now (see HEARTBEAT.md). This is a manual trigger." --session-id heartbeat-manual --timeout 120 2>&1`,
    130000
  )
  return { success: true, output: result || "Heartbeat triggered" }
}

export async function getSystemResources() {
  const [diskRaw, memRaw, loadRaw] = await Promise.all([
    runCommand("df -h / | tail -1"),
    runCommand("free -m | grep Mem"),
    runCommand("cat /proc/loadavg"),
  ])

  let disk = { total: "0G", used: "0G", percent: 0 }
  if (diskRaw) {
    const parts = diskRaw.split(/\s+/)
    disk = {
      total: parts[1] || "0G",
      used: parts[2] || "0G",
      percent: parseInt(parts[4] || "0"),
    }
  }

  let memory = { total: 0, used: 0, percent: 0 }
  if (memRaw) {
    const parts = memRaw.split(/\s+/)
    const total = parseInt(parts[1] || "0")
    const used = parseInt(parts[2] || "0")
    memory = { total, used, percent: total ? Math.round((used / total) * 100) : 0 }
  }

  let cpu = 0
  if (loadRaw) {
    cpu = Math.round(parseFloat(loadRaw.split(" ")[0] || "0") * 100) / 100
  }

  return { disk, memory, cpu }
}
