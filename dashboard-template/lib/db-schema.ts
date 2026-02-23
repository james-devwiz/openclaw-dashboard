// SQLite schema — all CREATE TABLE statements and index creation

import type Database from "better-sqlite3"

export function createTables(db: Database.Database): void {
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

  createActivityTables(db)
  createChatTables(db)
  createDocumentTables(db)
  createMcpTables(db)
  createLinkedInTables(db)
  createLeadTables(db)
  createStudioTables(db)
  createMiscTables(db)
}

function createActivityTables(db: Database.Database): void {
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
}

function createChatTables(db: Database.Database): void {
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
    CREATE TABLE IF NOT EXISTS chat_read_cursors (
      topic TEXT PRIMARY KEY,
      lastReadAt TEXT NOT NULL
    )
  `)
}

function createDocumentTables(db: Database.Database): void {
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
}

function createMcpTables(db: Database.Database): void {
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
}

function createLinkedInTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_threads (
      id TEXT PRIMARY KEY,
      unipileId TEXT UNIQUE,
      participantId TEXT,
      participantName TEXT NOT NULL DEFAULT '',
      participantHeadline TEXT DEFAULT '',
      participantAvatarUrl TEXT DEFAULT '',
      participantProfileUrl TEXT DEFAULT '',
      lastMessage TEXT DEFAULT '',
      lastMessageAt TEXT,
      lastMessageDirection TEXT DEFAULT '',
      unreadCount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      category TEXT DEFAULT '',
      champScore INTEGER,
      qualificationData TEXT,
      isSnoozed INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      syncedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_threads_status ON linkedin_threads(status)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_threads_last_msg ON linkedin_threads(lastMessageAt DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_threads_status_snooze ON linkedin_threads(status, isSnoozed)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_threads_classified ON linkedin_threads(classifiedAt)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_threads_created ON linkedin_threads(createdAt)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_messages (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      unipileId TEXT UNIQUE,
      senderId TEXT,
      senderName TEXT DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      direction TEXT NOT NULL DEFAULT 'incoming',
      timestamp TEXT NOT NULL,
      FOREIGN KEY (threadId) REFERENCES linkedin_threads(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_msgs_thread ON linkedin_messages(threadId, timestamp)")
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_li_msgs_unipile ON linkedin_messages(unipileId)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_actions (
      id TEXT PRIMARY KEY,
      actionType TEXT NOT NULL,
      targetId TEXT,
      targetName TEXT DEFAULT '',
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      approvalId TEXT,
      error TEXT,
      executedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_actions_status ON linkedin_actions(status)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_invitations (
      id TEXT PRIMARY KEY,
      unipileInvitationId TEXT UNIQUE NOT NULL,
      inviterName TEXT NOT NULL DEFAULT '',
      inviterHeadline TEXT DEFAULT '',
      inviterLocation TEXT DEFAULT '',
      inviterProviderId TEXT DEFAULT '',
      invitationText TEXT DEFAULT '',
      decision TEXT NOT NULL DEFAULT 'error',
      reason TEXT DEFAULT '',
      icpMatch TEXT,
      threadId TEXT,
      messagesSent INTEGER NOT NULL DEFAULT 0,
      processedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_invitations_processed ON linkedin_invitations(processedAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_draft_history (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      instruction TEXT DEFAULT '',
      variants TEXT NOT NULL DEFAULT '[]',
      usedVariantIndex INTEGER,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (threadId) REFERENCES linkedin_threads(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_draft_history_thread ON linkedin_draft_history(threadId, createdAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS linkedin_score_history (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      total INTEGER NOT NULL,
      band TEXT NOT NULL,
      scoreData TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (threadId) REFERENCES linkedin_threads(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_li_score_history_thread ON linkedin_score_history(threadId, createdAt DESC)")
}

function createLeadTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      contactName TEXT DEFAULT '',
      contactTitle TEXT DEFAULT '',
      email TEXT DEFAULT '',
      emailVerified TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      website TEXT DEFAULT '',
      linkedinUrl TEXT DEFAULT '',
      location TEXT DEFAULT '',
      industry TEXT DEFAULT '',
      companySize TEXT DEFAULT '',
      estimatedRevenue TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'New',
      business TEXT NOT NULL DEFAULT 'Business A',
      priority TEXT NOT NULL DEFAULT 'Medium',
      score INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'Manual',
      companyData TEXT DEFAULT '',
      enrichmentData TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      nextAction TEXT DEFAULT '',
      nextActionDate TEXT,
      lastContactedAt TEXT,
      goalId TEXT,
      signalType TEXT DEFAULT '',
      signalDetail TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE SET NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(createdAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_activities (
      id TEXT PRIMARY KEY,
      leadId TEXT NOT NULL,
      activityType TEXT NOT NULL DEFAULT 'note',
      content TEXT NOT NULL DEFAULT '',
      outcome TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(leadId)")
}

function createStudioTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'text',
      stage TEXT NOT NULL DEFAULT 'Idea',
      caption TEXT DEFAULT '',
      body TEXT DEFAULT '',
      hook TEXT DEFAULT '',
      cta TEXT DEFAULT '',
      scriptNotes TEXT DEFAULT '',
      slides TEXT DEFAULT '[]',
      researchNotes TEXT DEFAULT '',
      topic TEXT DEFAULT '',
      hashtags TEXT DEFAULT '[]',
      goalId TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium',
      source TEXT NOT NULL DEFAULT 'Manual',
      parentPostId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE SET NULL,
      FOREIGN KEY (parentPostId) REFERENCES posts(id) ON DELETE SET NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_posts_stage ON posts(stage)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_posts_format ON posts(format)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_posts_updated ON posts(updatedAt DESC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_platforms (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      platform TEXT NOT NULL,
      platformStatus TEXT NOT NULL DEFAULT 'draft',
      scheduledAt TEXT,
      publishedAt TEXT,
      publishedUrl TEXT DEFAULT '',
      platformPostId TEXT DEFAULT '',
      captionOverride TEXT DEFAULT '',
      approvalId TEXT,
      error TEXT DEFAULT '',
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_post_platforms_post ON post_platforms(postId)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_post_platforms_scheduled ON post_platforms(scheduledAt)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_media (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      mediaType TEXT NOT NULL DEFAULT 'image',
      filename TEXT NOT NULL DEFAULT '',
      mimeType TEXT NOT NULL DEFAULT '',
      fileSize INTEGER NOT NULL DEFAULT 0,
      filePath TEXT NOT NULL DEFAULT '',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      altText TEXT DEFAULT '',
      metadata TEXT DEFAULT '',
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(postId)")
}

function createMiscTables(db: Database.Database): void {
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
    CREATE TABLE IF NOT EXISTS model_preferences (
      modelId TEXT PRIMARY KEY,
      disabled INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_comments (
      id TEXT PRIMARY KEY,
      leadId TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_lead_comments_lead ON lead_comments(leadId, createdAt ASC)")

  db.exec(`
    CREATE TABLE IF NOT EXISTS idea_sources (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      comments TEXT DEFAULT '',
      frequency TEXT NOT NULL,
      cronJobId TEXT,
      cronJobName TEXT,
      validationScore INTEGER,
      validationSummary TEXT,
      validationDetails TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec("CREATE INDEX IF NOT EXISTS idx_idea_sources_created ON idea_sources(createdAt DESC)")

  // Auto-cleanup old MCP call logs (>30 days)
  db.exec("DELETE FROM mcp_call_logs WHERE createdAt < datetime('now', '-30 days')")
}
