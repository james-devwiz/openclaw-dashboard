// Workspace file reader for Memory / Second Brain

import { readdir, readFile, stat } from "fs/promises"
import { join, relative, basename, extname } from "path"

import type { MemoryItem, MemoryCategory } from "@/types"

export const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE_PATH || "/root/.openclaw/workspace"

const DIR_MAP: Record<string, MemoryCategory> = {
  business: "business",
  tmp: "business",
  orchestration: "orchestration",
  memory: "memory",
  research: "research",
  transcripts: "research",
  drafts: "research",
  projects: "projects",
}

/** Reverse map: category → directories to scan */
const CATEGORY_DIRS: Record<MemoryCategory, string[]> = {
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

function pathToId(relativePath: string): string {
  return Buffer.from(relativePath).toString("base64url")
}

function buildItem(relPath: string, content: string, mtime: Date): MemoryItem {
  const title = basename(relPath, ".md").replace(/[-_]/g, " ")
  return {
    id: pathToId(relPath),
    title,
    category: resolveCategory(relPath),
    content,
    excerpt: content.slice(0, 200).replace(/\n/g, " ").trim(),
    filePath: join(WORKSPACE_ROOT, relPath),
    relativePath: relPath,
    lastModified: mtime.toISOString(),
  }
}

/** Recursively collect .md files from a directory */
async function collectMdFiles(dir: string, root: string): Promise<MemoryItem[]> {
  const items: MemoryItem[] = []
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return items }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      items.push(...await collectMdFiles(fullPath, root))
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      const relPath = relative(root, fullPath)
      const content = await readFile(fullPath, "utf-8")
      const fileStat = await stat(fullPath)
      items.push(buildItem(relPath, content, fileStat.mtime))
    }
  }
  return items
}

/** Collect .md files from root directory only (non-recursive) */
async function collectRootMdFiles(): Promise<MemoryItem[]> {
  const items: MemoryItem[] = []
  let entries
  try { entries = await readdir(WORKSPACE_ROOT, { withFileTypes: true }) } catch { return items }

  for (const entry of entries) {
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      const fullPath = join(WORKSPACE_ROOT, entry.name)
      const content = await readFile(fullPath, "utf-8")
      const fileStat = await stat(fullPath)
      items.push(buildItem(entry.name, content, fileStat.mtime))
    }
  }
  return items
}

/** Load files for a single category — only scans relevant directories */
export async function listCategoryFiles(category: MemoryCategory): Promise<MemoryItem[]> {
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

/** Fast category counts — readdir + stat only, no readFile */
export async function getCategoryCounts(): Promise<Record<string, number>> {
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
  } catch { /* workspace dir missing */ }

  // Count each category's subdirectories
  for (const [cat, dirs] of Object.entries(CATEGORY_DIRS)) {
    if (cat === "core" || cat === "uncategorised") continue
    for (const dir of dirs) {
      counts[cat] += await countMdFilesRecursive(join(WORKSPACE_ROOT, dir))
    }
  }

  return counts
}

async function countMdFilesRecursive(dir: string): Promise<number> {
  let count = 0
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return 0 }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countMdFilesRecursive(join(dir, entry.name))
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      count++
    }
  }
  return count
}

export async function listWorkspaceFiles(): Promise<MemoryItem[]> {
  const items = await collectMdFiles(WORKSPACE_ROOT, WORKSPACE_ROOT)
  return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified))
}

export async function readWorkspaceFile(relativePath: string): Promise<MemoryItem | null> {
  const resolved = join(WORKSPACE_ROOT, relativePath)
  if (!resolved.startsWith(WORKSPACE_ROOT)) return null

  try {
    const content = await readFile(resolved, "utf-8")
    const fileStat = await stat(resolved)
    return buildItem(relativePath, content, fileStat.mtime)
  } catch {
    return null
  }
}

/** Scan all files and find cross-references between them */
export async function getFileReferences(): Promise<Record<string, string[]>> {
  const items = await collectMdFiles(WORKSPACE_ROOT, WORKSPACE_ROOT)
  const refs: Record<string, string[]> = {}

  for (const target of items) {
    const filename = basename(target.relativePath, ".md")
    refs[target.relativePath] = []

    for (const source of items) {
      if (source.relativePath === target.relativePath) continue
      // Check if source content mentions target filename or relative path
      if (
        source.content.includes(filename) ||
        source.content.includes(target.relativePath)
      ) {
        refs[target.relativePath].push(source.relativePath)
      }
    }
  }

  return refs
}

export async function searchWorkspaceFiles(query: string): Promise<MemoryItem[]> {
  const items = await collectMdFiles(WORKSPACE_ROOT, WORKSPACE_ROOT)
  const lower = query.toLowerCase()
  return items.filter(
    (i) => i.title.toLowerCase().includes(lower) || i.content.toLowerCase().includes(lower)
  )
}
