// Workspace file write operations

import { writeFile, mkdir } from "fs/promises"
import { join, dirname } from "path"

import { WORKSPACE_ROOT } from "./workspace"

/** Validate and resolve a relative path within workspace root */
function safePath(relativePath: string): string {
  if (relativePath.includes("..") || relativePath.startsWith("/")) {
    throw new Error("Invalid path: traversal not allowed")
  }
  const resolved = join(WORKSPACE_ROOT, relativePath)
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Invalid path: outside workspace")
  }
  return resolved
}

/** Write content to an existing workspace file */
export async function writeWorkspaceFile(relativePath: string, content: string): Promise<void> {
  const resolved = safePath(relativePath)
  await writeFile(resolved, content, "utf-8")
}

/** Create a new workspace file, creating directories as needed */
export async function createWorkspaceFile(relativePath: string, content: string): Promise<void> {
  const resolved = safePath(relativePath)
  await mkdir(dirname(resolved), { recursive: true })
  await writeFile(resolved, content, "utf-8")
}

/** Append content to an existing workspace file */
export async function appendWorkspaceFile(relativePath: string, content: string): Promise<void> {
  const resolved = safePath(relativePath)
  const { readFile } = await import("fs/promises")
  const existing = await readFile(resolved, "utf-8")
  await writeFile(resolved, existing + "\n\n" + content, "utf-8")
}
