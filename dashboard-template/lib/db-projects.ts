// Project CRUD operations

import { randomUUID } from "crypto"

import { getDb } from "./db"
import { logActivity } from "./activity-logger"

import type { Project, ProjectFile, CreateProjectInput, UpdateProjectInput } from "@/types/project.types"

interface ProjectRow {
  id: string
  name: string
  description: string
  instructions: string
  icon: string
  color: string
  archived: number
  createdAt: string
  updatedAt: string
}

interface ProjectFileRow {
  projectId: string
  relativePath: string
  addedAt: string
}

function rowToProject(row: ProjectRow): Project {
  return { ...row }
}

// --- Projects ---

export function getProjects(includeArchived = false): Project[] {
  const db = getDb()
  const where = includeArchived ? "" : "WHERE p.archived = 0"
  const rows = db.prepare(`
    SELECT p.*, COUNT(DISTINCT pf.relativePath) as fileCount,
           COUNT(DISTINCT cs.id) as sessionCount
    FROM projects p
    LEFT JOIN project_files pf ON pf.projectId = p.id
    LEFT JOIN chat_sessions cs ON cs.projectId = p.id
    ${where}
    GROUP BY p.id
    ORDER BY p.updatedAt DESC
  `).all() as (ProjectRow & { fileCount: number; sessionCount: number })[]

  return rows.map((r) => ({ ...rowToProject(r), fileCount: r.fileCount, sessionCount: r.sessionCount }))
}

export function getProject(id: string): Project | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined
  if (!row) return null

  const fileCount = (db.prepare("SELECT COUNT(*) as cnt FROM project_files WHERE projectId = ?").get(id) as { cnt: number }).cnt
  const sessionCount = (db.prepare("SELECT COUNT(*) as cnt FROM chat_sessions WHERE projectId = ?").get(id) as { cnt: number }).cnt

  return { ...rowToProject(row), fileCount, sessionCount }
}

export function createProject(input: CreateProjectInput): Project {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO projects (id, name, description, instructions, icon, color, archived, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, input.name, input.description || "", input.instructions || "", input.icon || "folder", input.color || "blue", now, now)

  logActivity({
    entityType: "project", entityId: id,
    entityName: input.name, action: "created",
  })

  return getProject(id)!
}

export function updateProject(id: string, updates: UpdateProjectInput): Project | null {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined
  if (!existing) return null

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  }
  if (fields.length === 0) return getProject(id)

  fields.push("updatedAt = ?")
  values.push(now, id)

  db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values)

  logActivity({
    entityType: "project", entityId: id,
    entityName: updates.name || existing.name, action: "updated",
    detail: Object.keys(updates).join(", "),
  })

  return getProject(id)
}

export function deleteProject(id: string): void {
  const db = getDb()
  const row = db.prepare("SELECT name FROM projects WHERE id = ?").get(id) as { name: string } | undefined
  if (!row) return

  db.prepare("DELETE FROM projects WHERE id = ?").run(id)

  logActivity({
    entityType: "project", entityId: id,
    entityName: row.name, action: "deleted",
  })
}

// --- Project Files ---

export function getProjectFiles(projectId: string): ProjectFile[] {
  const db = getDb()
  return db.prepare(
    "SELECT * FROM project_files WHERE projectId = ? ORDER BY addedAt DESC"
  ).all(projectId) as ProjectFileRow[]
}

export function addProjectFiles(projectId: string, relativePaths: string[]): void {
  const db = getDb()
  const now = new Date().toISOString()
  const insert = db.prepare(
    "INSERT OR IGNORE INTO project_files (projectId, relativePath, addedAt) VALUES (?, ?, ?)"
  )

  const tx = db.transaction(() => {
    for (const path of relativePaths) {
      insert.run(projectId, path, now)
    }
  })
  tx()

  db.prepare("UPDATE projects SET updatedAt = ? WHERE id = ?").run(now, projectId)
}

export function removeProjectFile(projectId: string, relativePath: string): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare("DELETE FROM project_files WHERE projectId = ? AND relativePath = ?").run(projectId, relativePath)
  db.prepare("UPDATE projects SET updatedAt = ? WHERE id = ?").run(now, projectId)
}

// --- Project Sessions ---

export function getProjectSessions(projectId: string) {
  const db = getDb()
  return db.prepare(`
    SELECT s.id, s.topic, s.title, s.createdAt, s.updatedAt,
           COUNT(m.id) as messageCount
    FROM chat_sessions s
    LEFT JOIN chat_messages m ON m.sessionId = s.id
    WHERE s.projectId = ?
    GROUP BY s.id
    ORDER BY s.updatedAt DESC
  `).all(projectId) as import("@/types/chat.types").ChatSession[]
}

export function createProjectSession(projectId: string, title = "New chat") {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    "INSERT INTO chat_sessions (id, topic, title, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, "project", title, projectId, now, now)

  return { id, topic: "project", title, projectId, messageCount: 0, createdAt: now, updatedAt: now }
}
