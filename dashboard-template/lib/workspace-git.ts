// Git operations for workspace version history

import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)
const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE_PATH || "/root/.openclaw/workspace"

export interface GitLogEntry {
  hash: string
  date: string
  message: string
}

/** Validate git hash (hex only) */
function assertHash(h: string): void {
  if (!/^[0-9a-f~^]+$/i.test(h)) throw new Error("Invalid git hash")
}

/** Ensure the workspace is a git repo (idempotent) */
export async function ensureGitRepo(): Promise<void> {
  try {
    await execFileAsync("git", ["rev-parse", "--git-dir"], { cwd: WORKSPACE_ROOT })
  } catch {
    await execFileAsync("git", ["init"], { cwd: WORKSPACE_ROOT })
    await execFileAsync("git", ["add", "."], { cwd: WORKSPACE_ROOT })
    await execFileAsync("git", ["commit", "-m", "Initial commit", "--allow-empty"], { cwd: WORKSPACE_ROOT })
  }
}

/** Commit a specific file after edit */
export async function commitFile(relativePath: string, message?: string): Promise<void> {
  try {
    await ensureGitRepo()
    await execFileAsync("git", ["add", relativePath], { cwd: WORKSPACE_ROOT })
    await execFileAsync("git", ["commit", "-m", message || `Updated ${relativePath}`, "--allow-empty"], { cwd: WORKSPACE_ROOT })
  } catch (err) {
    console.error("Git commit failed (non-fatal):", err)
  }
}

/** Get git log for a specific file */
export async function getFileHistory(relativePath: string, limit = 20): Promise<GitLogEntry[]> {
  try {
    await ensureGitRepo()
    const { stdout } = await execFileAsync(
      "git", ["log", "--follow", `--format=%H|%aI|%s`, `-n`, `${limit}`, "--", relativePath],
      { cwd: WORKSPACE_ROOT }
    )
    return stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, date, ...rest] = line.split("|")
      return { hash, date, message: rest.join("|") }
    })
  } catch (error) {
    console.error(`Failed to get file history for ${relativePath}:`, error)
    return []
  }
}

/** Get unified diff between two commits for a file */
export async function getFileDiff(relativePath: string, fromHash: string, toHash: string): Promise<string> {
  assertHash(fromHash)
  assertHash(toHash)
  try {
    const { stdout } = await execFileAsync(
      "git", ["diff", fromHash, toHash, "--", relativePath],
      { cwd: WORKSPACE_ROOT }
    )
    return stdout
  } catch (error) {
    console.error(`Failed to get file diff for ${relativePath}:`, error)
    return ""
  }
}

/** Get file content at a specific commit */
export async function getFileAtCommit(relativePath: string, hash: string): Promise<string> {
  assertHash(hash)
  try {
    const { stdout } = await execFileAsync(
      "git", ["show", `${hash}:${relativePath}`],
      { cwd: WORKSPACE_ROOT }
    )
    return stdout
  } catch (error) {
    console.error(`Failed to get file at commit ${hash} for ${relativePath}:`, error)
    return ""
  }
}
