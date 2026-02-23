// Workspace file reader for Memory / Second Brain

import { readdir, readFile, stat } from "fs/promises"
import { join, relative, basename, extname } from "path"

import {
  WORKSPACE_ROOT,
  resolveCategory as _resolveCategory,
  listCategoryFiles as _listCategoryFiles,
  getCategoryCounts as _getCategoryCounts,
} from "./workspace-categories"

import type { MemoryItem, MemoryCategory } from "@/types"

// Re-export category constants, WORKSPACE_ROOT, and resolveCategory for consumers
export { DIR_MAP, CATEGORY_DIRS, WORKSPACE_ROOT, resolveCategory } from "./workspace-categories"

function pathToId(relativePath: string): string {
  return Buffer.from(relativePath).toString("base64url")
}

function buildItem(relPath: string, content: string, mtime: Date): MemoryItem {
  const title = basename(relPath, ".md").replace(/[-_]/g, " ")
  return {
    id: pathToId(relPath),
    title,
    category: _resolveCategory(relPath),
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

/** Load files for a single category */
export async function listCategoryFiles(category: MemoryCategory): Promise<MemoryItem[]> {
  return _listCategoryFiles(category, collectRootMdFiles, collectMdFiles)
}

/** Fast category counts */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  return _getCategoryCounts(countMdFilesRecursive)
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
  } catch (error) {
    console.error(`Failed to read workspace file ${relativePath}:`, error)
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
