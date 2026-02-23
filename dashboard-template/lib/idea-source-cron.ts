// Cron job management for idea sources — create, delete, toggle via CLI

import { runCmd } from "./gateway"
import { FREQUENCY_CRON_MAP } from "./content-constants"
import type { IdeaSource, IdeaSourcePlatform, IdeaSourceFrequency } from "@/types"

const DASHBOARD_TOKEN = process.env.DASHBOARD_API_TOKEN || ""

function buildScanPrompt(source: IdeaSource): string {
  return `You are scanning an idea source for business-relevant ideas.

Platform: ${source.platform}
URL: ${source.url}
${source.comments ? `User notes: ${source.comments}` : ""}

Instructions:
1. Check the source for new or notable content since your last scan
2. For each relevant finding, POST it to the Content Studio API:

curl -s -X POST http://localhost:18790/api/content \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${DASHBOARD_TOKEN}" \\
  -H "X-Activity-Source: cron" \\
  -d '{"title":"...","contentType":"Idea","stage":"Idea","topic":"...","researchNotes":"...","source":"AI Suggestion","sourceUrl":"<specific-url>","sourceType":"${sourceTypeFromPlatform(source.platform)}","ideaCategories":["Content Idea"],"priority":"Medium"}'

Only post genuinely valuable ideas — quality over quantity. Max 3 per scan.
Focus on: trends, competitor moves, content inspiration, business opportunities.
Businesses: Business C (education), Business A (automation services), Business B (SaaS tools).`
}

function sourceTypeFromPlatform(platform: IdeaSourcePlatform): string {
  const map: Record<IdeaSourcePlatform, string> = {
    youtube: "YouTube", linkedin: "Blog", x: "Blog",
    reddit: "Reddit", website: "Blog", email: "Newsletter",
  }
  return map[platform] || "Blog"
}

export async function createIdeaSourceCron(
  source: IdeaSource
): Promise<{ cronJobId: string; cronJobName: string }> {
  const shortId = source.id.slice(0, 5)
  const cronJobName = `idea-scan-${source.platform}-${shortId}`
  const cron = FREQUENCY_CRON_MAP[source.frequency as IdeaSourceFrequency] || "0 6 * * *"
  const message = buildScanPrompt(source)

  const args = [
    "cron", "add",
    "--name", cronJobName,
    "--cron", cron,
    "--tz", "Australia/Brisbane",
    "--model", "haiku",
    "--message", message,
    "--session", "isolated",
    "--no-deliver",
    "--json",
  ]

  const result = await runCmd("openclaw", args, 15000)

  // Parse JSON response for the UUID
  let cronJobId = ""
  try {
    const parsed = JSON.parse(result)
    cronJobId = parsed.id || parsed.uuid || ""
  } catch {
    // Fallback: extract UUID from text output
    const uuidMatch = result.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i)
    cronJobId = uuidMatch ? uuidMatch[0] : ""
  }

  if (!cronJobId) {
    console.error("Failed to parse cron job ID from:", result)
  }

  return { cronJobId, cronJobName }
}

export async function deleteIdeaSourceCron(cronJobId: string): Promise<void> {
  if (!cronJobId) return
  await runCmd("openclaw", ["cron", "remove", cronJobId, "--json"], 10000)
}

export async function toggleIdeaSourceCron(cronJobId: string, enable: boolean): Promise<void> {
  if (!cronJobId) return
  await runCmd("openclaw", ["cron", "edit", cronJobId, enable ? "--enable" : "--disable"], 10000)
}
