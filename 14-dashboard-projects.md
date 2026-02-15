# Phase 14: Dashboard Projects — Scoped AI Workspaces

## Goal

Build a Claude Projects-like feature: each project has editable system instructions, linked knowledge base files (from workspace), and scoped chat sessions. Project context is injected server-side on every chat request — no gateway changes needed.

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

---

### 14.1 Database Schema

Add to `lib/db.ts` → `initSchema()`:

**`projects` table:**

```sql
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
);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updatedAt DESC);
```

**`project_files` junction table** (links projects to workspace files by relative path):

```sql
CREATE TABLE IF NOT EXISTS project_files (
  projectId TEXT NOT NULL,
  relativePath TEXT NOT NULL,
  addedAt TEXT NOT NULL,
  PRIMARY KEY (projectId, relativePath),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(projectId);
```

**`chat_sessions` migration** — add nullable `projectId` column:

```sql
ALTER TABLE chat_sessions ADD COLUMN projectId TEXT;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(projectId);
```

### 14.2 Activity Types

Add `"project"` to `ActivityEntityType` in `types/activity.types.ts`. Add a matching case in `lib/activity-utils.ts` → `getActivityConfig()` with `FolderOpen` icon and indigo colour scheme.

### 14.3 Shared Streaming Utility — `lib/chat-stream.ts`

Extract the SSE streaming logic from `/api/chat/route.ts` into a shared utility:

```typescript
export async function createGatewayStream(options: {
  messages: Array<{ role: string; content: unknown }>
  sessionKey: string
  model?: string
  onComplete?: (fullResponse: string) => void
  postProcess?: (fullResponse: string) => { events: string[]; chatContent: string }
}): Promise<Response>
```

Both `/api/chat` and `/api/projects/[id]/chat` call this function. The only difference is how messages are constructed:
- Topic chat: client sends history with system prompt already included
- Project chat: server prepends project context, then passes to `createGatewayStream()`

Refactor `/api/chat/route.ts` to use `createGatewayStream()` and verify existing topic chat still works.

### 14.4 Types — `types/project.types.ts`

```typescript
export interface Project {
  id: string
  name: string
  description: string
  instructions: string
  icon: string
  color: string
  archived: number
  createdAt: string
  updatedAt: string
  fileCount?: number
  sessionCount?: number
}

export interface ProjectFile {
  projectId: string
  relativePath: string
  addedAt: string
  // Enriched from workspace at read-time:
  title?: string
  category?: string
  excerpt?: string
  missing?: boolean        // true if workspace file was deleted
}

export interface CreateProjectInput {
  name: string
  description?: string
  instructions?: string
  icon?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  instructions?: string
  icon?: string
  color?: string
  archived?: number
}
```

Re-export from `types/index.ts`.

### 14.5 Database Layer — `lib/db-projects.ts`

Full CRUD with activity logging:

| Function | Purpose |
|---|---|
| `getProjects(includeArchived?)` | List projects with fileCount + sessionCount (LEFT JOIN) |
| `getProject(id)` | Single project with counts |
| `createProject(input)` | Insert + logActivity |
| `updateProject(id, updates)` | Dynamic field update + logActivity |
| `deleteProject(id)` | Delete + CASCADE + logActivity |
| `getProjectFiles(projectId)` | List linked files |
| `addProjectFiles(projectId, relativePaths[])` | INSERT OR IGNORE (idempotent) |
| `removeProjectFile(projectId, relativePath)` | Unlink single file |
| `getProjectSessions(projectId)` | List chat sessions with message counts |
| `createProjectSession(projectId, title?)` | Insert session with `topic = "project"` |

### 14.6 API Routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/projects` | GET, POST, PATCH, DELETE | Project CRUD |
| `/api/projects/[id]` | GET | Single project with full details |
| `/api/projects/[id]/files` | GET, POST, DELETE | Link/unlink workspace files |
| `/api/projects/[id]/sessions` | GET, POST, PATCH, DELETE | Project chat session CRUD |
| `/api/projects/[id]/chat` | POST | Chat with server-side context injection |

### 14.7 Context Injection — The Critical Route

`/api/projects/[id]/chat/route.ts` is the key differentiator. On every POST:

1. Load project from DB
2. Load `project.instructions` (if non-empty after trim)
3. Load ALL linked file contents via `readWorkspaceFile()` for each path
4. Build a system message with XML-tagged sections:
   ```
   <project-instructions>...</project-instructions>
   <knowledge-base>
     <file path="research/topic.md">...content...</file>
     <file path="business/strategy.md">...content...</file>
   </knowledge-base>
   ```
5. Enforce 100k character budget — truncate files that exceed it, set `X-Context-Truncated` header
6. Prepend system message to the messages array
7. Forward to gateway via `createGatewayStream()`
8. Save user + assistant messages to DB

**Why server-side injection works:**
- Context loaded fresh every request — impossible to skip
- Instructions updated mid-conversation → next message uses new version
- File added/removed → next message reflects the change
- File deleted from VPS → `readWorkspaceFile()` returns `null`, silently skipped
- Client never sees raw file contents

### 14.8 Service — `services/project.service.ts`

```typescript
getProjectsApi()
createProjectApi(input)
updateProjectApi(id, updates)
deleteProjectApi(id)
getProjectApi(id)
getProjectFilesApi(projectId)
addProjectFilesApi(projectId, relativePaths[])
removeProjectFileApi(projectId, relativePath)
getProjectSessionsApi(projectId)
createProjectSessionApi(projectId)
renameProjectSessionApi(sessionId, title)
deleteProjectSessionApi(projectId, sessionId)
```

### 14.9 Hooks

**`useProjects()`** — project list with CRUD:
```typescript
{ projects, loading, error, createProject, updateProject, deleteProject, refresh }
```

**`useProjectDetail(projectId)`** — single project with files:
```typescript
{ project, files, loading, error, updateProject, addFiles, removeFile, refresh }
```

**`useProjectChat(projectId)`** — chat orchestrator (no client-side system prompt):
```typescript
{
  messages, isStreaming, loading,
  sendMessage, clearMessages,
  selectedModel, setSelectedModel,
  currentSessionId, sessions,
  createNewSession, switchSession, renameSession, removeSession,
  cleanup,
}
```

Key difference from `useChat`: `buildHistory()` does NOT prepend any system message. The server handles all context injection.

### 14.10 UI Components

9 components in `components/projects/`:

| Component | Purpose |
|---|---|
| `ProjectCard.tsx` | Grid card showing name, description, file/session counts |
| `CreateProjectDialog.tsx` | Modal for creating a new project |
| `ProjectHeader.tsx` | Detail page header with inline rename |
| `ProjectTabs.tsx` | Tab bar — Chat, Instructions, Knowledge Base |
| `ProjectChatTab.tsx` | Composes ChatMessageList, ChatHistoryDrawer, ModelSelector |
| `ProjectChatInput.tsx` | Input field with file attachment support |
| `InstructionsEditor.tsx` | Auto-saving textarea for project instructions |
| `KnowledgeBasePanel.tsx` | Linked files grid with remove capability |
| `FilePickerDialog.tsx` | Browse workspace files to select and link |

**Chat component reuse:** `ChatMessageList`, `ChatHistoryDrawer`, `ModelSelector`, `MarkdownMessage`, and `MentionAutocomplete` are all reused as-is from the existing chat system.

### 14.11 Pages

**`app/projects/page.tsx`** — Projects list:
- PageHeader with "New Project" button
- Grid of ProjectCards (3 columns on desktop)
- Empty state with icon + prompt

**`app/projects/[id]/page.tsx`** — Project detail:
- ProjectHeader with back link and inline rename
- ProjectTabs for switching between Chat, Instructions, Knowledge Base
- Tab content fills remaining viewport height

### 14.12 Sidebar

Add Projects nav item to `components/layout/Sidebar.tsx` after Chat, using `FolderOpen` icon.

---

## Verification

- [ ] Create a project → appears in list with correct name and description
- [ ] Edit project name → updates immediately
- [ ] Link workspace files → appear in Knowledge Base tab
- [ ] Remove a file → disappears from Knowledge Base
- [ ] Set instructions to "Always respond in pirate speak" → send a chat message → response follows instructions
- [ ] Link a workspace file → send a message referencing it → response uses file content
- [ ] Change instructions → next message uses updated instructions
- [ ] Create multiple chat sessions → messages isolated between them
- [ ] Switch sessions → correct history loads
- [ ] Delete project → cascades to files and sessions
- [ ] Activity page shows project create/update/delete events with indigo icon
- [ ] Existing topic chat still works (streaming extraction didn't break it)
