// SQLite migrations — ALTER TABLE and data transformations

import type Database from "better-sqlite3"

export function runMigrations(db: Database.Database): void {
  migrateTaskColumns(db)
  migrateApprovalsRelatedTask(db)
  migrateProjectIdOnChatSessions(db)
  migrateChatSessions(db)
  migrateTaskStatusesAndCategories(db)
  demoteStaleWeeklyTasks(db)
  ensureDefaultGoal(db)
  migrateBriefTypes(db)
  migrateChatAttachments(db)
  migrateDocumentFolders(db)
  migrateLinkedInIntelligence(db)
  migrateLinkedInWampV2(db)
  migrateLinkedInUnreadFix(db)
  migrateLeadPipeline(db)
  migrateContentIdeas(db)
  migrateContentFormats(db)
}

function hasColumn(db: Database.Database, table: string, col: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return cols.some((c) => c.name === col)
}

function migrateTaskColumns(db: Database.Database): void {
  if (!hasColumn(db, "tasks", "goalId")) db.exec("ALTER TABLE tasks ADD COLUMN goalId TEXT")
  if (!hasColumn(db, "tasks", "complexity")) db.exec("ALTER TABLE tasks ADD COLUMN complexity TEXT DEFAULT 'Moderate'")
  if (!hasColumn(db, "tasks", "estimatedMinutes")) db.exec("ALTER TABLE tasks ADD COLUMN estimatedMinutes INTEGER")
  if (!hasColumn(db, "tasks", "assignee")) db.exec("ALTER TABLE tasks ADD COLUMN assignee TEXT")
}

function migrateApprovalsRelatedTask(db: Database.Database): void {
  if (!hasColumn(db, "approvals", "relatedTaskId")) db.exec("ALTER TABLE approvals ADD COLUMN relatedTaskId TEXT")
}

function migrateTaskStatusesAndCategories(db: Database.Database): void {
  db.prepare("UPDATE tasks SET status = 'To Do This Week' WHERE status = 'To Do'").run()
  db.prepare("UPDATE tasks SET status = 'Completed' WHERE status = 'Done'").run()
  db.prepare("UPDATE tasks SET category = 'Personal' WHERE category = 'System'").run()
}

function demoteStaleWeeklyTasks(db: Database.Database): void {
  const now = new Date()
  const aest = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const day = aest.getUTCDay()
  const startOfWeek = new Date(aest)
  startOfWeek.setUTCDate(aest.getUTCDate() - day)
  startOfWeek.setUTCHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7)
  const weekStart = startOfWeek.toISOString().slice(0, 10)
  const weekEnd = endOfWeek.toISOString().slice(0, 10)

  db.prepare(
    `UPDATE tasks SET status = 'Backlog' WHERE status = 'To Do This Week'
     AND (dueDate IS NULL OR dueDate < ? OR dueDate >= ?)`
  ).run(weekStart, weekEnd)
  db.prepare(
    `UPDATE tasks SET status = 'Backlog' WHERE status = 'To Be Scheduled'
     AND dueDate IS NOT NULL AND dueDate < ?`
  ).run(weekStart)
}

function migrateProjectIdOnChatSessions(db: Database.Database): void {
  if (!hasColumn(db, "chat_sessions", "projectId")) {
    db.exec("ALTER TABLE chat_sessions ADD COLUMN projectId TEXT")
    db.exec("CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(projectId)")
  }
}

function migrateChatSessions(db: Database.Database): void {
  if (!hasColumn(db, "chat_messages", "sessionId")) {
    db.exec("ALTER TABLE chat_messages ADD COLUMN sessionId TEXT NOT NULL DEFAULT ''")
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_chat_session_created ON chat_messages(sessionId, createdAt ASC)")

  const orphanTopics = db
    .prepare("SELECT DISTINCT topic FROM chat_messages WHERE sessionId = ''")
    .all() as Array<{ topic: string }>

  for (const { topic } of orphanTopics) {
    const sessionId = `legacy-${topic}`
    const now = new Date().toISOString()
    const first = db
      .prepare("SELECT content FROM chat_messages WHERE topic = ? AND sessionId = '' AND role = 'user' ORDER BY createdAt ASC LIMIT 1")
      .get(topic) as { content: string } | undefined
    const title = first ? first.content.slice(0, 60) : `${topic} (legacy)`
    db.prepare("INSERT OR IGNORE INTO chat_sessions (id, topic, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(sessionId, topic, title, now, now)
    db.prepare("UPDATE chat_messages SET sessionId = ? WHERE topic = ? AND sessionId = ''").run(sessionId, topic)
  }
}

function migrateBriefTypes(db: Database.Database): void {
  db.prepare("UPDATE briefs SET briefType = 'Error Report' WHERE briefType = 'Custom' AND title LIKE '%Error Report%'").run()
  db.prepare("UPDATE briefs SET briefType = 'Self-Improvement Report' WHERE briefType = 'Custom' AND title LIKE '%Self-Improvement%'").run()
}

function migrateChatAttachments(db: Database.Database): void {
  if (!hasColumn(db, "chat_messages", "attachments")) db.exec("ALTER TABLE chat_messages ADD COLUMN attachments TEXT DEFAULT ''")
}

function migrateDocumentFolders(db: Database.Database): void {
  if (!hasColumn(db, "documents", "folder")) {
    db.exec("ALTER TABLE documents ADD COLUMN folder TEXT NOT NULL DEFAULT 'general'")
    db.exec("CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder)")
  }
  if (!hasColumn(db, "documents", "projectId")) {
    db.exec("ALTER TABLE documents ADD COLUMN projectId TEXT")
    db.exec("CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(projectId)")
  }
  if (!hasColumn(db, "documents", "agentId")) {
    db.exec("ALTER TABLE documents ADD COLUMN agentId TEXT")
    db.exec("CREATE INDEX IF NOT EXISTS idx_documents_agent ON documents(agentId)")
  }
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
  db.prepare("UPDATE tasks SET goalId = 'general' WHERE goalId IS NULL").run()
}

function migrateLinkedInIntelligence(db: Database.Database): void {
  const addCol = (col: string, def: string) => {
    if (!hasColumn(db, "linkedin_threads", col)) db.exec(`ALTER TABLE linkedin_threads ADD COLUMN ${col} ${def}`)
  }
  addCol("isSelling", "INTEGER DEFAULT 0")
  addCol("classifiedAt", "TEXT")
  addCol("intent", "TEXT DEFAULT ''")
  addCol("wampScore", "INTEGER")
  addCol("enrichmentData", "TEXT")
  addCol("snoozeUntil", "TEXT")
  addCol("manualClassification", "INTEGER DEFAULT 0")
  addCol("classificationNote", "TEXT DEFAULT ''")
  db.exec("UPDATE linkedin_threads SET status = 'unread' WHERE status = 'new'")
}

function migrateLinkedInWampV2(db: Database.Database): void {
  if (!hasColumn(db, "linkedin_threads", "isQualified")) {
    db.exec("ALTER TABLE linkedin_threads ADD COLUMN isQualified INTEGER DEFAULT 0")
    db.exec("UPDATE linkedin_threads SET isQualified = 1, status = 'needs-reply' WHERE status = 'qualified'")
  }
  if (!hasColumn(db, "linkedin_threads", "isPartner")) db.exec("ALTER TABLE linkedin_threads ADD COLUMN isPartner INTEGER DEFAULT 0")
  if (!hasColumn(db, "linkedin_threads", "postData")) db.exec("ALTER TABLE linkedin_threads ADD COLUMN postData TEXT")
  if (hasColumn(db, "linkedin_threads", "wampScore")) {
    const sample = db.prepare("SELECT wampScore FROM linkedin_threads WHERE wampScore IS NOT NULL AND wampScore <= 10 LIMIT 1").get()
    if (sample) db.exec("UPDATE linkedin_threads SET wampScore = NULL, qualificationData = NULL WHERE wampScore IS NOT NULL AND wampScore <= 10")
  }
}

function migrateLinkedInUnreadFix(db: Database.Database): void {
  if (!hasColumn(db, "linkedin_threads", "status")) return
  const fixed1 = db.prepare("UPDATE linkedin_threads SET status = 'needs-reply' WHERE status = 'unread' AND unreadCount = 0").run()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const fixed2 = db.prepare("UPDATE linkedin_threads SET status = 'needs-reply', unreadCount = 0 WHERE status = 'unread' AND lastMessageAt < ?").run(weekAgo)
  const total = fixed1.changes + fixed2.changes
  if (total > 0) console.log(`[migration] Fixed ${total} linkedin threads: unread → needs-reply`)
}

function migrateLeadPipeline(db: Database.Database): void {
  const addCol = (col: string, def: string) => {
    if (!hasColumn(db, "leads", col)) db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${def}`)
  }
  addCol("logoUrl", "TEXT DEFAULT ''")
  addCol("outreachDrafts", "TEXT DEFAULT ''")
  addCol("researchSummary", "TEXT DEFAULT ''")
  addCol("callOutcome", "TEXT DEFAULT ''")
  addCol("callNotes", "TEXT DEFAULT ''")
  addCol("followUpDrafts", "TEXT DEFAULT ''")
  addCol("linkedinConnected", "INTEGER DEFAULT 0")
  if (!hasColumn(db, "approvals", "relatedLeadId")) {
    db.exec("ALTER TABLE approvals ADD COLUMN relatedLeadId TEXT")
    db.exec("CREATE INDEX IF NOT EXISTS idx_approvals_relatedLeadId ON approvals(relatedLeadId)")
  }
}

function migrateContentIdeas(db: Database.Database): void {
  const addCol = (col: string, def: string) => {
    if (!hasColumn(db, "content", col)) db.exec(`ALTER TABLE content ADD COLUMN ${col} ${def}`)
  }
  addCol("ideaCategories", "TEXT DEFAULT ''")
  addCol("sourceUrl", "TEXT DEFAULT ''")
  addCol("sourceType", "TEXT DEFAULT ''")
  addCol("promotedTaskId", "TEXT")
}

function migrateContentFormats(db: Database.Database): void {
  const addCol = (col: string, def: string) => {
    if (!hasColumn(db, "content", col)) db.exec(`ALTER TABLE content ADD COLUMN ${col} ${def}`)
  }
  addCol("contentFormats", "TEXT DEFAULT ''")
  addCol("promotedPipelineIds", "TEXT DEFAULT ''")
  addCol("vetScore", "INTEGER")
  addCol("vetReasoning", "TEXT DEFAULT ''")
  addCol("vetEvidence", "TEXT DEFAULT ''")
  db.prepare(
    `UPDATE content SET vetScore = 7, vetReasoning = 'Pre-existing idea — accepted without vetting', vetEvidence = 'Manually created by user'
     WHERE contentType = 'Idea' AND vetScore IS NULL`
  ).run()
}
