import { NextResponse } from "next/server"
import { readFile } from "fs/promises"

import { readConfig, writeConfig, restartGateway } from "@/lib/gateway"

const MANAGED_DIR = "/root/.openclaw/skills"
const BUNDLED_DIR = "/usr/lib/node_modules/openclaw/skills"

function stripFrontmatter(content: string): string {
  if (!content.startsWith("---")) return content
  const end = content.indexOf("---", 3)
  if (end === -1) return content
  return content.slice(end + 3).trim()
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  if (!/^[a-z0-9_-]+$/i.test(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 })
  }

  const candidates = [
    { path: `${MANAGED_DIR}/${name}/SKILL.md`, source: "managed" },
    { path: `${BUNDLED_DIR}/${name}/SKILL.md`, source: "openclaw-bundled" },
  ]

  for (const { path, source } of candidates) {
    try {
      const raw = await readFile(path, "utf-8")
      return NextResponse.json({
        name,
        content: stripFrontmatter(raw),
        source,
        filePath: path,
      })
    } catch {
      continue
    }
  }

  return NextResponse.json(
    { error: `No SKILL.md found for "${name}"` },
    { status: 404 }
  )
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  if (!/^[a-z0-9_-]+$/i.test(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 })
  }

  try {
    const { enabled } = await req.json() as { enabled: boolean }
    const config = await readConfig()

    if (!config.skills) config.skills = {}
    if (!config.skills.entries) config.skills.entries = {}
    const entry = (config.skills.entries[name] || {}) as Record<string, unknown>
    entry.disabled = !enabled
    config.skills.entries[name] = entry

    await writeConfig(config)
    await restartGateway()

    return NextResponse.json({ name, disabled: !enabled })
  } catch (err) {
    console.error("Skill toggle error:", err)
    return NextResponse.json(
      { error: "Failed to toggle skill" },
      { status: 500 }
    )
  }
}
