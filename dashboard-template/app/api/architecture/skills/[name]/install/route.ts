import { NextResponse } from "next/server"
import { readFile } from "fs/promises"

import { runCmd } from "@/lib/gateway"
import type { SkillInstallSpec } from "@/types/index"

const MANAGED_DIR = "/root/.openclaw/skills"
const BUNDLED_DIR = "/usr/lib/node_modules/openclaw/skills"
const ALLOWED_KINDS = new Set(["go", "npm", "download", "brew", "uv"])

function stripTrailingCommas(s: string): string {
  return s.replace(/,(\s*[}\]])/g, "$1")
}

function parseMetadataJson(raw: string): Record<string, unknown> | null {
  if (!raw.startsWith("---")) return null
  const end = raw.indexOf("---", 3)
  if (end === -1) return null
  const fm = raw.slice(3, end)
  const metaIdx = fm.indexOf("metadata:")
  if (metaIdx === -1) return null
  const afterMeta = fm.slice(metaIdx + "metadata:".length)
  const braceStart = afterMeta.indexOf("{")
  if (braceStart === -1) return null
  const jsonCandidate = afterMeta.slice(braceStart)
  try {
    return JSON.parse(stripTrailingCommas(jsonCandidate))
  } catch (error) {
    console.error("Failed to parse skill metadata JSON:", error)
    return null
  }
}

function extractInstallSpecs(raw: string): SkillInstallSpec[] {
  const fm = parseMetadataJson(raw)
  const specs = (fm as Record<string, unknown>)?.openclaw as Record<string, unknown>
  const install = specs?.install as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(install)) return []

  return install.map((spec) => ({
    id: spec.id as string,
    kind: spec.kind as string,
    label: spec.label as string,
    bins: (spec.bins as string[]) || [],
    module: spec.module as string | undefined,
    formula: spec.formula as string | undefined,
    url: spec.url as string | undefined,
    package: spec.package as string | undefined,
    available: spec.kind !== "brew",
  }))
}

async function readSkillMd(name: string): Promise<string | null> {
  for (const dir of [MANAGED_DIR, BUNDLED_DIR]) {
    try {
      return await readFile(`${dir}/${name}/SKILL.md`, "utf-8")
    } catch { continue }
  }
  return null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 })
  }

  const raw = await readSkillMd(name)
  if (!raw) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 })
  }

  return NextResponse.json({ specs: extractInstallSpecs(raw) })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 })
  }

  const { installId } = await req.json() as { installId: string }
  const raw = await readSkillMd(name)
  if (!raw) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 })
  }

  const specs = extractInstallSpecs(raw)
  const spec = specs.find((s) => s.id === installId)
  if (!spec) {
    return NextResponse.json({ error: "Install spec not found" }, { status: 404 })
  }
  if (!ALLOWED_KINDS.has(spec.kind)) {
    return NextResponse.json({ error: `Unknown kind: ${spec.kind}` }, { status: 400 })
  }
  if (!spec.available) {
    return NextResponse.json({ error: `${spec.kind} not available on this platform` }, { status: 400 })
  }

  try {
    let bin: string
    let args: string[]
    switch (spec.kind) {
      case "go":
        if (!spec.module || !/^[a-zA-Z0-9._/@-]+$/.test(spec.module)) {
          return NextResponse.json({ error: "Invalid go module" }, { status: 400 })
        }
        bin = "go"
        args = ["install", spec.module]
        break
      case "npm":
        if (!spec.package || !/^[@a-zA-Z0-9._/-]+$/.test(spec.package)) {
          return NextResponse.json({ error: "Invalid npm package" }, { status: 400 })
        }
        bin = "npm"
        args = ["install", "-g", spec.package]
        break
      case "uv":
        if (!spec.package || !/^[@a-zA-Z0-9._\[\] /-]+$/.test(spec.package)) {
          return NextResponse.json({ error: "Invalid uv package" }, { status: 400 })
        }
        bin = "uv"
        args = ["pip", "install", "--system", "--break-system-packages", spec.package]
        break
      default:
        return NextResponse.json({ error: `Install kind "${spec.kind}" not yet supported` }, { status: 400 })
    }

    const output = await runCmd(bin, args, 120000)
    return NextResponse.json({ success: true, message: output || "Installed successfully" })
  } catch (err) {
    console.error("Skill install error:", err)
    return NextResponse.json({ error: "Install failed" }, { status: 500 })
  }
}
