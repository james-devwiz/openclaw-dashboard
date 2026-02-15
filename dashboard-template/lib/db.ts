// SQLite database — connection, schema init, migration logic

import Database from "better-sqlite3"
import { existsSync, renameSync } from "fs"

import { SITE_CONFIG } from "./site-config"

const NEW_DB_PATH = "/root/.openclaw/mission-control.db"
const OLD_DB_PATH = "/root/.openclaw/tasks.db"

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    migrateDbPath()
    _db = new Database(NEW_DB_PATH)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")
    initSchema(_db)
  }
  return _db
}

function migrateDbPath(): void {
  if (!existsSync(NEW_DB_PATH) && existsSync(OLD_DB_PATH)) {
    renameSync(OLD_DB_PATH, NEW_DB_PATH)
  }
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'To Do',
      priority TEXT NOT NULL DEFAULT 'Medium',
      category TEXT NOT NULL DEFAULT 'System',
      dueDate TEXT,
      source TEXT NOT NULL DEFAULT 'Manual',
      goalId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // Add goalId column to existing tasks table if missing
  const cols = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === "goalId")) {
    db.exec("ALTER TABLE tasks ADD COLUMN goalId TEXT")
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',
      category TEXT NOT NULL DEFAULT 'Business',
      targetDate TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      metric TEXT DEFAULT '',
      currentValue TEXT DEFAULT '',
      targetValue TEXT DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'Medium',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      contentType TEXT NOT NULL DEFAULT 'General Dictation',
      stage TEXT NOT NULL DEFAULT 'Idea',
      goalId TEXT,
      topic TEXT DEFAULT '',
      researchNotes TEXT DEFAULT '',
      draft TEXT DEFAULT '',
      platform TEXT NOT NULL DEFAULT 'General',
      scheduledDate TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium',
      aiGenerated INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'Manual',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Information Requested',
      status TEXT NOT NULL DEFAULT 'Pending',
      priority TEXT NOT NULL DEFAULT 'Medium',
      context TEXT DEFAULT '',
      options TEXT DEFAULT '',
      response TEXT DEFAULT '',
      relatedGoalId TEXT,
      requestedBy TEXT NOT NULL DEFAULT 'Manual',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      resolvedAt TEXT,
      FOREIGN KEY (relatedGoalId) REFERENCES goals(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      entityName TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      changes TEXT DEFAULT '',
      source TEXT NOT NULL DEFAULT 'dashboard',
      createdAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(createdAt DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entityType, entityId)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(taskId, createdAt ASC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS briefs (
      id TEXT PRIMARY KEY,
      briefType TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      metadata TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_briefs_date ON briefs(date DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_briefs_type ON briefs(briefType)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_briefs_created ON briefs(createdAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS heartbeats (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'success',
      model TEXT NOT NULL DEFAULT '',
      duration INTEGER NOT NULL DEFAULT 0,
      summary TEXT NOT NULL DEFAULT '',
      detail TEXT DEFAULT '',
      triggeredBy TEXT NOT NULL DEFAULT 'heartbeat',
      createdAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_heartbeats_created ON heartbeats(createdAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT 'Notes',
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(createdAt DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'New chat',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      sessionId TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_chat_topic_created ON chat_messages(topic, createdAt ASC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS cron_goals (
      cronJobName TEXT PRIMARY KEY,
      goalId TEXT NOT NULL,
      FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_suggestions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      sourceType TEXT NOT NULL DEFAULT 'manual',
      sourceId TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      targetCategory TEXT DEFAULT 'memory',
      targetFile TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_memory_suggestions_status ON memory_suggestions(status)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      icon TEXT DEFAULT 'folder',
      color TEXT DEFAULT 'blue',
      archived INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updatedAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS project_files (
      projectId TEXT NOT NULL,
      relativePath TEXT NOT NULL,
      addedAt TEXT NOT NULL,
      PRIMARY KEY (projectId, relativePath),
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(projectId)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_read_cursors (
      topic TEXT PRIMARY KEY,
      lastReadAt TEXT NOT NULL
    )
  `)

  // MCP Management Centre tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      transport TEXT NOT NULL DEFAULT 'stdio',
      url TEXT NOT NULL DEFAULT '',
      command TEXT DEFAULT '',
      args TEXT DEFAULT '',
      env TEXT DEFAULT '',
      authType TEXT NOT NULL DEFAULT 'none',
      authConfig TEXT DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'unknown',
      statusMessage TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      lastHealthCheck TEXT,
      toolCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_servers_updated ON mcp_servers(updatedAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_tools (
      id TEXT PRIMARY KEY,
      serverId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      inputSchema TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      lastSynced TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (serverId) REFERENCES mcp_servers(id) ON DELETE CASCADE,
      UNIQUE(serverId, name)
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_tools_server ON mcp_tools(serverId)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(name)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_bindings (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      serverId TEXT NOT NULL,
      toolId TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      rateLimit INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (serverId) REFERENCES mcp_servers(id) ON DELETE CASCADE,
      FOREIGN KEY (toolId) REFERENCES mcp_tools(id) ON DELETE SET NULL,
      UNIQUE(projectId, serverId, toolId)
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_bindings_project ON mcp_bindings(projectId)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_call_logs (
      id TEXT PRIMARY KEY,
      serverId TEXT NOT NULL,
      toolName TEXT NOT NULL,
      projectId TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      latencyMs INTEGER NOT NULL DEFAULT 0,
      inputSummary TEXT DEFAULT '',
      outputSummary TEXT DEFAULT '',
      errorMessage TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (serverId) REFERENCES mcp_servers(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_created ON mcp_call_logs(createdAt DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_mcp_call_logs_server ON mcp_call_logs(serverId)")

  // Auto-cleanup old MCP call logs (>30 days)
  db.exec("DELETE FROM mcp_call_logs WHERE createdAt < datetime('now', '-30 days')")

  migrateProjectIdOnChatSessions(db)
  migrateChatSessions(db)
  migrateTaskStatusesAndCategories(db)
  migrateApprovalsRelatedTask(db)
  demoteStaleWeeklyTasks(db)
  ensureDefaultGoal(db)
  seedReadCursors(db)
  migrateBriefTypes(db)
}

function migrateApprovalsRelatedTask(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(approvals)").all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === "relatedTaskId")) {
    db.exec("ALTER TABLE approvals ADD COLUMN relatedTaskId TEXT")
  }
}

function demoteStaleWeeklyTasks(db: Database.Database): void {
  // Move "To Do This Week" tasks with no due date or expired due date back to Backlog
  const now = new Date()
  const local = new Date(now.getTime() + SITE_CONFIG.utcOffsetHours * 60 * 60 * 1000)
  const day = local.getUTCDay()
  const startOfWeek = new Date(local)
  startOfWeek.setUTCDate(local.getUTCDate() - day)
  startOfWeek.setUTCHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7)
  const weekStart = startOfWeek.toISOString().slice(0, 10)
  const weekEnd = endOfWeek.toISOString().slice(0, 10)

  db.prepare(
    `UPDATE tasks SET status = 'Backlog' WHERE status = 'To Do This Week'
     AND (dueDate IS NULL OR dueDate < ? OR dueDate >= ?)`
  ).run(weekStart, weekEnd)
}

function migrateTaskStatusesAndCategories(db: Database.Database): void {
  db.prepare("UPDATE tasks SET status = 'To Do This Week' WHERE status = 'To Do'").run()
  db.prepare("UPDATE tasks SET status = 'Completed' WHERE status = 'Done'").run()
  db.prepare("UPDATE tasks SET category = 'Personal' WHERE category = 'System'").run()
}

function migrateProjectIdOnChatSessions(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(chat_sessions)").all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === "projectId")) {
    db.exec("ALTER TABLE chat_sessions ADD COLUMN projectId TEXT")
    db.exec("CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(projectId)")
  }
}

function migrateChatSessions(db: Database.Database): void {
  // Add sessionId column if missing (existing DBs)
  const cols = db.prepare("PRAGMA table_info(chat_messages)").all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === "sessionId")) {
    db.exec("ALTER TABLE chat_messages ADD COLUMN sessionId TEXT NOT NULL DEFAULT ''")
  }

  // Index must be created after column exists (both new and migrated DBs)
  db.exec("CREATE INDEX IF NOT EXISTS idx_chat_session_created ON chat_messages(sessionId, createdAt ASC)")

  // Migrate orphan messages (sessionId = '') into legacy sessions
  const orphanTopics = db
    .prepare("SELECT DISTINCT topic FROM chat_messages WHERE sessionId = ''")
    .all() as Array<{ topic: string }>

  for (const { topic } of orphanTopics) {
    const sessionId = `legacy-${topic}`
    const now = new Date().toISOString()

    // Get first user message for title
    const first = db
      .prepare("SELECT content FROM chat_messages WHERE topic = ? AND sessionId = '' AND role = 'user' ORDER BY createdAt ASC LIMIT 1")
      .get(topic) as { content: string } | undefined
    const title = first ? first.content.slice(0, 60) : `${topic} (legacy)`

    db.prepare(
      "INSERT OR IGNORE INTO chat_sessions (id, topic, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)"
    ).run(sessionId, topic, title, now, now)

    db.prepare("UPDATE chat_messages SET sessionId = ? WHERE topic = ? AND sessionId = ''").run(sessionId, topic)
  }
}

function seedReadCursors(db: Database.Database): void {
  const topics = db
    .prepare("SELECT DISTINCT topic FROM chat_messages")
    .all() as Array<{ topic: string }>
  const now = new Date().toISOString()
  const stmt = db.prepare("INSERT OR IGNORE INTO chat_read_cursors (topic, lastReadAt) VALUES (?, ?)")
  for (const { topic } of topics) {
    stmt.run(topic, now)
  }
}

function migrateBriefTypes(db: Database.Database): void {
  // Re-type nightly "Custom" briefs to proper types
  db.prepare("UPDATE briefs SET briefType = 'Error Report' WHERE briefType = 'Custom' AND title LIKE '%Error Report%'").run()
  db.prepare("UPDATE briefs SET briefType = 'Self-Improvement Report' WHERE briefType = 'Custom' AND title LIKE '%Self-Improvement%'").run()
}

function ensureDefaultGoal(db: Database.Database): void {
  const exists = db.prepare("SELECT id FROM goals WHERE id = 'general'").get()
  if (!exists) {
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO goals (id, name, description, status, category, progress, priority, createdAt, updatedAt)
       VALUES ('general', 'General', 'Default goal for uncategorised tasks', 'Active', 'Business', 0, 'Medium', ?, ?)`
    ).run(now, now)
  }
  // Assign existing tasks without a goal to the default
  db.prepare("UPDATE tasks SET goalId = 'general' WHERE goalId IS NULL").run()
}
