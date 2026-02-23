# Phase 9: Data Layer — SQLite, API Routes, Services & Types

## Goal

Build the complete data layer: SQLite database with 5 tables, server-side gateway client, type definitions, API routes for all CRUD operations, service wrappers, and hooks. This phase creates everything needed to store, read, and mutate data — subsequent phases build the UI on top.

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

---

### 9.1 SQLite Database — `lib/db.ts`

The database lives at `/root/.openclaw/mission-control.db` on the VPS. It uses `better-sqlite3` (synchronous, no ORM overhead).

**Schema — 5 tables:**

```sql
-- Tasks
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
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  category TEXT NOT NULL DEFAULT 'Personal',
  targetDate TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  metric TEXT DEFAULT '',
  currentValue TEXT DEFAULT '',
  targetValue TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Content
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
);

-- Approvals
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
  relatedTaskId TEXT,
  requestedBy TEXT NOT NULL DEFAULT 'Manual',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  resolvedAt TEXT,
  FOREIGN KEY (relatedGoalId) REFERENCES goals(id) ON DELETE SET NULL
);

-- Cron-goal mapping (bridges VPS cron jobs to dashboard goals)
CREATE TABLE IF NOT EXISTS cron_goals (
  cronJobName TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

-- Activities (auto-populated by logActivity)
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
);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entityType, entityId);

-- Chat read cursors (added Phase 11.8)
CREATE TABLE IF NOT EXISTS chat_read_cursors (
  topic TEXT PRIMARY KEY,
  lastReadAt TEXT NOT NULL
);
```

**Key behaviours:**
- WAL journal mode and foreign keys enabled via pragmas
- Auto-migration from old path: `/root/.openclaw/tasks.db` → `mission-control.db`
- Default "General" goal auto-created for uncategorised tasks
- Existing tasks without a `goalId` are assigned to the General goal
- `goalId` column added to existing tasks table if missing (migration)

### 9.2 Activity Logger — `lib/activity-logger.ts` + `lib/activity-source.ts`

Every CRUD mutation auto-calls `logActivity()`. This populates the activities table without manual tracking.

```typescript
function logActivity(params: {
  entityType: ActivityEntityType  // "task" | "goal" | "content" | "approval" | "chat" | "brief" | "heartbeat" | "memory" | "project" | "mcp"
  entityId: string
  entityName: string
  action: "created" | "updated" | "deleted" | "status_changed" | "stage_changed" | "responded"
  detail?: string
  changes?: Record<string, [unknown, unknown]>
  source?: string
}): void
```

- Auto-generates UUID for `id`
- `changes` is JSON-stringified as `{ field: [oldVal, newVal] }` for updates
- `source` uses request-scoped context via `getActivitySource()` (see below), falling back to `"dashboard"`
- Called after every create, update, and delete in `lib/db-*.ts` modules
- Entity types must match: heartbeats log as `"heartbeat"` (not `"task"`), briefs as `"brief"` (not `"content"`)

**Activity Source Attribution — `lib/activity-source.ts`:**

Uses Node.js `AsyncLocalStorage` to propagate the activity source through the request lifecycle without modifying function signatures:

```typescript
export type ActivitySource = "dashboard" | "cron" | "openclaw" | "api"

// In API routes, wrap mutation handlers:
export function withActivitySource<T>(request: NextRequest, handler: () => Promise<T>): Promise<T>
// Reads X-Activity-Source header → runs handler in AsyncLocalStorage context

// In logActivity(), called automatically:
export function getActivitySource(): ActivitySource
// Returns the source from AsyncLocalStorage, or "dashboard" if not set
```

All API route mutation handlers (POST/PATCH/DELETE) in `app/api/` are wrapped with `withActivitySource(request, async () => { ... })`. External callers (gateway, cron jobs, Telegram/Slack) send `X-Activity-Source: openclaw|cron|api` header to attribute actions correctly in the activity feed.

### 9.3 Domain DB Modules

Create one module per domain, each calling `logActivity()` after mutations:

| Module | Functions | API Route |
|---|---|---|
| `lib/db-tasks.ts` | `getTasks(goalId?)`, `createTask()`, `updateTask()`, `deleteTask()` | `/api/tasks` |
| `lib/db-goals.ts` | `getGoals()`, `createGoal()`, `updateGoal()`, `deleteGoal()` | `/api/goals` |
| `lib/db-content.ts` | `getContent()`, `createContent()`, `updateContent()`, `deleteContent()` | `/api/content` |
| `lib/db-approvals.ts` | `getApprovals()`, `createApproval()`, `updateApproval()`, `deleteApproval()` | `/api/approvals` |
| `lib/db-activity.ts` | `getActivities(filters?)`, `getActivitiesByEntity(type, id)` | `/api/activity` |
| `lib/db-documents.ts` | `getDocuments(opts?)`, `getDocumentCount(opts?)`, `getDocumentById(id)`, `createDocument()`, `updateDocument()`, `deleteDocument()` | `/api/documents` |

### 9.4 Gateway Client — `lib/gateway.ts`

Reads OpenClaw config and system state directly on VPS (server-side only):

| Function | What It Does |
|---|---|
| `getGatewayHealth()` | Checks if gateway process is running, reads channel status from config |
| `getGatewayConfig()` | Returns version, model, heartbeat config, cron/plugin/skill counts |
| `triggerCronJob(name)` | Runs `openclaw cron trigger <name>` via `child_process` |
| `getSystemResources()` | Reads disk (`df`), memory (`free`), CPU load (`/proc/loadavg`) |

**Config path gotchas:**

| Data | Wrong Path | Correct Path |
|---|---|---|
| Telegram connected | `config.plugins.telegram.enabled` | `config.channels.telegram.enabled` |
| Heartbeat enabled | `config.heartbeat.enabled` | `config.agents.defaults.heartbeat.every` |
| Heartbeat interval | `config.heartbeat.interval` | `config.agents.defaults.heartbeat.every` (parse `"60m"` with regex) |
| Plugin list | `config.plugins` | `config.plugins.entries` |

**System resources mapping:**
- CPU: load average float (e.g., `0.42`) — multiply by 100 or display as-is
- Memory: `free -m | grep Mem` → parse total/used, calculate percent
- Disk: `df -h / | tail -1` → parse used/total/percent

### 9.5 Workspace Reader & Writer — `lib/workspace.ts`, `lib/workspace-write.ts`, `lib/workspace-git.ts`

Reads and writes workspace files from `/root/.openclaw/workspace/` for the Memory browser:

**`lib/workspace.ts`** — Read operations:
- `DIR_MAP`: Maps directory names → categories. `CATEGORY_DIRS`: Reverse map for scoped scanning.
- `getCategoryCounts()`: Fast readdir-only counts (no file content reads)
- `listCategoryFiles(category)`: Only scans relevant subdirectories for a category
- `listWorkspaceFiles()`: Full recursive scan (for "All Files" tab only)
- `readWorkspaceFile(relativePath)`: Single file read with path traversal protection
- `searchWorkspaceFiles(query)`: Full-text search across titles + content
- `getFileReferences()`: Cross-reference scan (which files mention which other files)
- Categories: core, business, orchestration, memory, research, projects, uncategorised

**`lib/workspace-write.ts`** — Write operations:
- `writeWorkspaceFile()`, `createWorkspaceFile()`, `appendWorkspaceFile()`
- All use `safePath()` — rejects `..` and absolute paths, validates within workspace root

**`lib/workspace-git.ts`** — Version history:
- Uses `execFile` (not `exec`) for shell injection safety. `assertHash()` validates git hashes.
- `ensureGitRepo()`, `commitFile()`, `getFileHistory()`, `getFileDiff()`, `getFileAtCommit()`
- Auto-commits on file save (non-fatal on failure)

**`lib/db-memory-suggestions.ts`** — Memory suggestions CRUD:
- SQLite table `memory_suggestions` with status-based workflow (pending → approved/dismissed)
- Approve auto-writes content to workspace

### 9.6 Type Definitions

Create types in `types/` with domain-specific files re-exported from `types/index.ts`:

**`types/index.ts`** — Central re-export + common types:
- `Task`, `TaskStatus` ("Backlog" | "To Do This Week" | "In Progress" | "Requires More Info" | "Blocked" | "Needs Review" | "Completed"), `TaskPriority`, `TaskCategory` ("Njin" | "Devwiz" | "AI Orchestrators" | "Personal"), `TaskSource` ("Manual" | "Cron" | "Heartbeat" | "Meeting" | "Brain Dump" | "Approval")
- `KanbanColumn` (status + tasks array)
- `CronJob` (name, schedule, model, target, status, lastRun, nextRun, goalId?, goalName?)
- `HealthStatus` (status, uptime, channels)
- `ChannelStatus` (connected boolean)
- `GatewayConfig` (version, model, heartbeat, counts)
- `Brief`, `BriefType`, `BriefKind`, `BriefSearchParams`, `BriefSearchResult`
- `CalendarEvent`
- `ChatMessage` (with `topic` and `isStreaming` fields), `ChatTopic`, `ChatTopicConfig`

**`types/goal.types.ts`:**
- `GoalStatus`: "Active" | "Achieved" | "Paused" | "Abandoned"
- `GoalCategory`: "Personal" | "System" | "Njin" | "Devwiz" | "AI Orchestrators"
- `Goal`: id, name, description, status, category, targetDate, progress (0-100), metric, currentValue, targetValue, priority, taskCount?, recurringCount?

**`types/content.types.ts`:**
- `ContentType`: "YouTube Script" | "Newsletter" | "Blog Post" | "Meeting Transcript" | "General Dictation" | "LinkedIn Content"
- `ContentStage`: "Idea" | "Research" | "Draft" | "Review" | "Published" | "Filed"
- `ContentPlatform`: "YouTube" | "Newsletter" | "Blog" | "LinkedIn" | "General"
- `ContentSource`: "AI Suggestion" | "Manual" | "Trending" | "Repurpose" | "Meeting" | "Voice Input"

**`types/approval.types.ts`:**
- `ApprovalCategory`: "Decision Needed" | "Information Requested" | "Content Review" | "Task Confirmation" | "Permission Request"
- `ApprovalStatus`: "Pending" | "Approved" | "Rejected" | "Deferred" | "Responded"
- `ApprovalPriority`: "Urgent" | "High" | "Medium" | "Low"
- `ApprovalRequester`: "Morning Cron" | "Heartbeat" | "Overnight Work" | "Content Pipeline" | "Task Generation" | "Manual"

**`types/activity.types.ts`:**
- `ActivityEntityType`: "task" | "goal" | "content" | "approval" | "chat" | "brief" | "heartbeat" | "memory" | "project"
- `ActivityAction`: "created" | "updated" | "deleted" | "status_changed" | "stage_changed" | "responded"
- `ActivityItem`: id, entityType, entityId, entityName, action, detail, changes (JSON string), source, createdAt
- `ActivityGroup`: date string + items array (for date-grouped display)

**`types/memory.types.ts`:**
- `MemoryCategory`: "core" | "business" | "orchestration" | "memory" | "research" | "projects" | "uncategorised"
- `MemoryItem`: id, title, category, content, excerpt, filePath, relativePath, lastModified
- `MemorySuggestion`: id, title, content, sourceType, sourceId, reason, status, targetCategory, targetFile, createdAt
- `SuggestionStatus`: "pending" | "approved" | "dismissed"
- `SearchResult`: type ("goal" | "task" | "content" | "approval" | "memory" | "document"), id, title, subtitle, href

### 9.7 API Routes

All routes are in `app/api/`. Pattern: GET for listing, POST for create, PATCH for update, DELETE for delete.

| Route | Methods | Purpose |
|---|---|---|
| `/api/tasks` | GET, POST, PATCH, DELETE | Task CRUD; GET accepts `?goalId`, `?category`, `?stats=true` |
| `/api/tasks/promote-weekly` | POST | Move Backlog tasks with next-week due dates to "To Do This Week" |
| `/api/tasks/pickup` | POST | Pick top-priority "To Do This Week" task → "In Progress" |
| `/api/goals` | GET, POST, PATCH, DELETE | Goal CRUD; GET returns `taskCount` + `recurringCount` per goal |
| `/api/content` | GET, POST, PATCH, DELETE | Content item CRUD |
| `/api/approvals` | GET, POST, PATCH, DELETE | Approval CRUD |
| `/api/approvals/count` | GET | Pending approval count (for sidebar badge) |
| `/api/activity` | GET | Activity feed with `?entityType` filter + offset pagination |
| `/api/health` | GET | Gateway health + channel status + system resources |
| `/api/gateway` | GET | Gateway config (version, heartbeat, counts) |
| `/api/cron` | GET, POST, PATCH | GET lists cron jobs (with goal links); POST triggers a job; PATCH links/unlinks a goal |
| `/api/memory` | GET, POST | GET: list files (`?category`, `?q`, `?counts=true`, `?refs=true`). POST: create/append file |
| `/api/memory/[id]` | GET, PUT | GET: read file. PUT: write file (auto-commits) |
| `/api/memory/[id]/history` | GET | Git log for file |
| `/api/memory/[id]/diff` | GET | Diff between commits (`?from`, `?to`) |
| `/api/memory/suggestions` | GET, POST, PATCH, DELETE | Memory suggestion CRUD; PATCH approve auto-writes to workspace |
| `/api/activity/entity` | GET | Per-entity activity; `?entityType`, `?entityId` |
| `/api/documents` | GET, POST, PATCH, DELETE | Document CRUD; GET accepts `?category`, `?search` (searches title, tags, content), `?limit`, `?offset` |
| `/api/search` | GET | Global search across all entities (goals, tasks, content, approvals, documents, memory) |
| `/api/chat` | POST | Chat streaming bridge (covered in Phase 11) |
| `/api/chat/models` | GET | List available AI models from openclaw.json |
| `/api/chat/sessions` | GET, POST | Chat session CRUD; `?topic` filter |
| `/api/chat/sessions/[id]` | PATCH, DELETE | Rename or delete individual session |
| `/api/chat/history` | GET | Load message history; `?sessionId` |
| `/api/chat/unread` | GET, POST | Unread counts per topic; POST marks topic read (Phase 11.8) |
| `/api/projects` | GET, POST, PATCH, DELETE | Project CRUD (covered in Phase 14) |
| `/api/projects/[id]/files` | GET, POST, DELETE | Project file links (Phase 14) |
| `/api/projects/[id]/sessions` | GET, POST | Project chat sessions (Phase 14) |
| `/api/projects/[id]/chat` | POST | Project-scoped chat with context injection (Phase 14) |

### 9.8 Service Layer

Create one service file per domain in `services/`:

| Service | Functions |
|---|---|
| `services/gateway.service.ts` | `getHealthApi()`, `getGatewayConfigApi()`, `triggerCronJobApi()`, `getSystemResourcesApi()` |
| `services/task.service.ts` | `getTasksApi()`, `createTaskApi()`, `updateTaskStatusApi()`, `deleteTaskApi()` |
| `services/goal.service.ts` | `getGoalsApi()`, `createGoalApi()`, `updateGoalApi()`, `deleteGoalApi()` |
| `services/content.service.ts` | `getContentApi()`, `createContentApi()`, `updateContentApi()`, `deleteContentApi()` |
| `services/approval.service.ts` | `getApprovalsApi()`, `createApprovalApi()`, `respondApprovalApi()`, `deleteApprovalApi()` |
| `services/activity.service.ts` | `getActivityApi()`, `filterActivitiesApi()` |
| `services/memory.service.ts` | `getMemoryItemsApi()`, `getMemoryItemApi()`, `updateMemoryItemApi()`, `saveToMemoryApi()`, `getMemoryRefsApi()`, `getMemoryCategoryCountsApi()`, `getMemoryHistoryApi()`, `getMemoryDiffApi()`, `getMemorySuggestionsApi()`, `respondToSuggestionApi()` |
| `services/brief.service.ts` | `getBriefsApi()`, `searchBriefsApi()`, `createBriefApi()`, `deleteBriefApi()` |
| `services/project.service.ts` | `getProjectsApi()`, `createProjectApi()`, `updateProjectApi()`, `deleteProjectApi()`, `getProjectFilesApi()`, `addProjectFilesApi()`, `removeProjectFileApi()` |
| `services/document.service.ts` | `getDocumentsApi()`, `createDocumentApi()`, `updateDocumentApi()`, `deleteDocumentApi()` |
| `services/search.service.ts` | `searchGlobalApi()` |

### 9.9 Hooks

Create one hook per domain in `hooks/`:

| Hook | Service | State |
|---|---|---|
| `hooks/useGateway.ts` | `gateway.service.ts` | Health + config, polls every 30s |
| `hooks/useTasks.ts` | `task.service.ts` | Task list, CRUD operations |
| `hooks/useGoals.ts` | `goal.service.ts` | Goal list, CRUD operations |
| `hooks/useContent.ts` | `content.service.ts` | Content list, CRUD operations |
| `hooks/useApprovals.ts` | `approval.service.ts` | Approval list, pending count (for sidebar badge) |
| `hooks/useActivity.ts` | `activity.service.ts` | Activity feed with filters/pagination |
| `hooks/useMemory.ts` | `memory.service.ts` | Memory file list, detail, edit, counts, refs |
| `hooks/useMemorySuggestions.ts` | `memory.service.ts` | Memory suggestion management |
| `hooks/useSaveToMemory.ts` | — | Save-to-memory modal state |
| `hooks/useCron.ts` | `gateway.service.ts` | Cron job list + trigger + goal linking |
| `hooks/useProjects.ts` | `project.service.ts` | Project list, CRUD operations |
| `hooks/useProjectDetail.ts` | `project.service.ts` | Single project + files + sessions |
| `hooks/useProjectChat.ts` | `project.service.ts` | Project-scoped chat with streaming |
| `hooks/useBriefSearch.ts` | `brief.service.ts` | Search/filter/paginate briefs |
| `hooks/useChatUnread.ts` | — | Unread counts, polls every 30s |
| `hooks/useDocuments.ts` | `document.service.ts` | Document list, pagination (PAGE_SIZE=20), CRUD operations |
| `hooks/useGlobalSearch.ts` | `search.service.ts` | Global search state |

---

## Verification

- [ ] SQLite database created at `/root/.openclaw/mission-control.db` with 5 tables (Phase 15 adds 4 more for MCP, Phase 14 adds 3 for Projects)
- [ ] Default "General" goal auto-created
- [ ] Activity logging works — creating a task also creates an activity record
- [ ] All API routes return correct data (test with curl or browser)
- [ ] `GET /api/health` returns gateway status and system resources
- [ ] `GET /api/gateway` returns config with heartbeat interval parsed from `"60m"` format
- [ ] `GET /api/tasks?goalId=general` filters tasks by goal
- [ ] `GET /api/approvals/count` returns `{ count: N }`
- [ ] `GET /api/activity?entityType=task` filters activities
- [x] `GET /api/memory` lists workspace files with categories
- [x] `GET /api/memory?counts=true` returns lightweight counts
- [x] `PUT /api/memory/[id]` writes file + auto-commits
- [x] `POST /api/memory` creates/appends files
- [x] `GET/POST/PATCH/DELETE /api/memory/suggestions` manages suggestions
- [x] `GET /api/memory/[id]/history` returns git log
- [x] `GET /api/memory/[id]/diff` returns unified diff
- [ ] All services wrap fetch calls correctly
- [ ] All hooks consume services (no direct `fetch()` in hooks)
- [ ] Type definitions match database schema exactly
