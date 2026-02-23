// Category logic for workspace memory system

import { readdir } from "fs/promises"
import { join, extname } from "path"

import type { MemoryCategory, MemoryItem } from "@/types"

/** Workspace root path — canonical definition, re-exported by workspace.ts */
export const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE_PATH || "/root/.openclaw/workspace"

export const DIR_MAP: Record<string, MemoryCategory> = {
  business: "business",
  tmp: "business",
  orchestration: "orchestration",
  memory: "memory",
  research: "research",
  transcripts: "research",
  drafts: "research",
  projects: "projects",
}

/** Reverse map: category to directories to scan */
export const CATEGORY_DIRS: Record<MemoryCategory, string[]> = {
  core: [],
  business: ["business", "tmp"],
  orchestration: ["orchestration"],
  memory: ["memory"],
  research: ["research", "transcripts", "drafts"],
  projects: ["projects"],
  uncategorised: [],
}

export function resolveCategory(relativePath: string): MemoryCategory {
  const parts = relativePath.split("/")
  if (parts.length === 1) return "core"
  const firstDir = parts[0].toLowerCase()
  return DIR_MAP[firstDir] || "uncategorised"
}

/** Load files for a single category -- only scans relevant directories */
export async function listCategoryFiles(
  category: MemoryCategory,
  collectRootMdFiles: () => Promise<MemoryItem[]>,
  collectMdFiles: (dir: string, root: string) => Promise<MemoryItem[]>,
): Promise<MemoryItem[]> {
  if (category === "core") return collectRootMdFiles()

  if (category === "uncategorised") {
    const all = await collectMdFiles(WORKSPACE_ROOT, WORKSPACE_ROOT)
    return all.filter((i) => i.category === "uncategorised")
  }

  const dirs = CATEGORY_DIRS[category]
  const items: MemoryItem[] = []
  for (const dir of dirs) {
    items.push(...await collectMdFiles(join(WORKSPACE_ROOT, dir), WORKSPACE_ROOT))
  }
  return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified))
}

/** Fast category counts -- readdir + stat only, no readFile */
export async function getCategoryCounts(
  countMdFilesRecursive: (dir: string) => Promise<number>,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {
    core: 0, business: 0, orchestration: 0, memory: 0,
    research: 0, projects: 0, uncategorised: 0,
  }

  // Count root-level .md files (core)
  try {
    const rootEntries = await readdir(WORKSPACE_ROOT, { withFileTypes: true })
    const knownDirs = new Set(Object.keys(DIR_MAP))

    for (const entry of rootEntries) {
      if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
        counts.core++
      } else if (entry.isDirectory() && !knownDirs.has(entry.name.toLowerCase())) {
        counts.uncategorised += await countMdFilesRecursive(join(WORKSPACE_ROOT, entry.name))
      }
    }
  } catch (error) { console.error("Workspace dir missing or unreadable:", error) }

  // Count each category's subdirectories
  for (const [cat, dirs] of Object.entries(CATEGORY_DIRS)) {
    if (cat === "core" || cat === "uncategorised") continue
    for (const dir of dirs) {
      counts[cat] += await countMdFilesRecursive(join(WORKSPACE_ROOT, dir))
    }
  }

  return counts
}
