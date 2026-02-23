// Gateway client — reads OpenClaw config and system state directly on VPS

import { readFile, writeFile, chmod } from "fs/promises"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

const CONFIG_PATH =
  process.env.OPENCLAW_CONFIG_PATH || "/root/.openclaw/openclaw.json"

interface OpenClawConfig {
  gateway?: { port?: number; auth?: { token?: string } }
  agents?: {
    defaults?: {
      model?: { primary?: string; fallbacks?: string[] }
      models?: Record<string, { alias?: string; disabled?: boolean }>
      workspace?: string
      heartbeat?: { every?: string; model?: string; target?: string }
    }
  }
  channels?: Record<string, { enabled?: boolean }>
  plugins?: { entries?: Record<string, { enabled?: boolean }> }
  skills?: { entries?: Record<string, unknown> }
  cron?: { enabled?: boolean }
}

export async function readConfig(): Promise<OpenClawConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8")
    return JSON.parse(raw)
  } catch (error) {
    console.error("Failed to read openclaw config:", error)
    return {}
  }
}

export async function runCmd(
  cmd: string, args: string[], timeoutMs = 5000
): Promise<string> {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: timeoutMs })
    return stdout.trim()
  } catch (error) {
    console.error(`Command failed: ${cmd} ${args.join(" ")}:`, error)
    return ""
  }
}

export async function writeConfig(config: OpenClawConfig): Promise<void> {
  if (!config.agents && !config.gateway && !config.channels) {
    throw new Error("Refusing to write empty config — readConfig() may have failed")
  }
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
  await chmod(CONFIG_PATH, 0o600)
}

export async function restartGateway(): Promise<void> {
  await runCmd("systemctl", ["--user", "restart", "openclaw-gateway"], 10000)
}

export async function getGatewayHealth() {
  const [config, serviceStatus, processCheck] = await Promise.all([
    readConfig(),
    runCmd("systemctl", ["is-active", "openclaw-gateway"]),
    runCmd("pgrep", ["-f", "openclaw-gateway"]),
  ])

  const isRunning = serviceStatus === "active" || processCheck !== ""
  const channels = config.channels || {}

  return {
    status: isRunning ? "healthy" : "down",
    uptime: isRunning ? "running" : "stopped",
    channels: {
      slack: { connected: !!channels.slack?.enabled },
      telegram: { connected: !!channels.telegram?.enabled },
      notion: { connected: !!config.skills?.entries?.notion },
    },
  }
}

export async function getGatewayConfig() {
  const config = await readConfig()
  const agents = config.agents?.defaults
  const pluginEntries = config.plugins?.entries || {}
  const skills = config.skills?.entries || {}
  const hb = agents?.heartbeat

  let cronJobs: unknown[] = []
  try {
    const cronRaw = await readFile("/root/.openclaw/cron/jobs.json", "utf-8")
    const parsed = JSON.parse(cronRaw)
    cronJobs = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.jobs) ? parsed.jobs : [])
  } catch (error) {
    console.error("Failed to read cron jobs.json:", error)
    cronJobs = []
  }

  let heartbeatInterval = 0
  if (hb?.every) {
    const match = hb.every.match(/^(\d+)m$/)
    if (match) heartbeatInterval = parseInt(match[1])
  }

  return {
    version: await runCmd("openclaw", ["--version"]),
    agent: "main",
    model: agents?.model?.primary || "unknown",
    fallbacks: agents?.model?.fallbacks || [],
    heartbeat: { enabled: !!hb?.every, interval: heartbeatInterval },
    cronJobCount: cronJobs.length,
    pluginCount: Object.keys(pluginEntries).length,
    skillCount: Object.keys(skills).length,
  }
}

export interface CronJobState {
  lastRunAt?: string
  lastStatus?: string
}

const CRON_JOBS_PATH = process.env.OPENCLAW_CRON_PATH || "/root/.openclaw/cron/jobs.json"

async function readCronJobs(): Promise<{ id: string; name: string; state: { lastRunAtMs: number | null; lastStatus: string | null } }[]> {
  try {
    const raw = await readFile(CRON_JOBS_PATH, "utf-8")
    const data = JSON.parse(raw)
    return data?.jobs || []
  } catch { return [] }
}

export async function getCronJobStates(jobNames: string[]): Promise<Record<string, CronJobState>> {
  const jobs = await readCronJobs()
  const result: Record<string, CronJobState> = {}
  for (const name of jobNames) {
    const job = jobs.find((j) => j.name === name)
    if (job) {
      result[name] = {
        lastRunAt: job.state.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : undefined,
        lastStatus: job.state.lastStatus || undefined,
      }
    }
  }
  return result
}

export async function triggerCronJob(jobName: string) {
  if (!/^[a-z0-9_-]+$/.test(jobName)) {
    throw new Error(`Invalid job name: ${jobName}`)
  }
  const jobs = await readCronJobs()
  const match = jobs.find((j) => j.name === jobName)
  if (!match) throw new Error(`Cron job not found: ${jobName}`)

  try {
    const { stdout, stderr } = await execFileAsync("openclaw", ["cron", "run", match.id], { timeout: 60000 })
    const output = stdout.trim()
    if (!output && stderr) throw new Error(stderr.trim().slice(0, 200))
    if (!output) throw new Error("No output from cron run")
    return { success: true, output }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    throw new Error(`Failed to run ${jobName}: ${msg}`)
  }
}

export async function triggerHeartbeat() {
  const result = await runCmd(
    "openclaw",
    ["agent", "--message", "Run your heartbeat checklist now (see HEARTBEAT.md). This is a manual trigger.", "--session-id", "heartbeat-manual", "--timeout", "120"],
    130000
  )
  return { success: true, output: result || "Heartbeat triggered" }
}

export async function getSystemResources() {
  const [diskRaw, memRaw, loadRaw] = await Promise.all([
    runCmd("df", ["-h", "/"]),
    runCmd("free", ["-m"]),
    readFile("/proc/loadavg", "utf-8").catch(() => ""),
  ])

  let disk = { total: "0G", used: "0G", percent: 0 }
  if (diskRaw) {
    // df output: second line has the data
    const lines = diskRaw.split("\n")
    const dataLine = lines[1] || ""
    const parts = dataLine.split(/\s+/)
    disk = {
      total: parts[1] || "0G",
      used: parts[2] || "0G",
      percent: parseInt(parts[4] || "0"),
    }
  }

  let memory = { total: 0, used: 0, percent: 0 }
  if (memRaw) {
    const memLine = memRaw.split("\n").find((l) => l.startsWith("Mem:")) || ""
    const parts = memLine.split(/\s+/)
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
