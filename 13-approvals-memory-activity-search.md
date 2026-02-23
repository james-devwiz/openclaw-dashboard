# Phase 13: Approvals, Memory, Activity & Cmd+K Search

## Goal

Build the remaining four dashboard features: an Approvals queue for human-in-the-loop decisions, a Memory browser for workspace files, an Activity timeline showing all CRUD history, and a global Cmd+K search that works from any page.

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

---

### 13.1 Approvals Page — `app/approvals/page.tsx`

Human-in-the-loop queue where your AI requests decisions and you respond.

**Layout:** PageHeader ("Approvals") with pending count → priority-sorted list of approval cards

**Components to create in `components/approvals/`:**

**ApprovalCard — `components/approvals/ApprovalCard.tsx`:**
- Left-border accent colored by priority:
  - Urgent: red (`border-l-red-500`)
  - High: amber (`border-l-amber-500`)
  - Medium: blue (`border-l-blue-500`)
  - Low: gray (`border-l-gray-400`)
- Title, category badge, priority badge, requested-by label
- Expandable context section (click to show/hide full context and options)
- Relative timestamp (`formatRelativeTime()`)

**ApprovalResponseInput — `components/approvals/ApprovalResponseInput.tsx`:**
- Textarea for freeform feedback + Send button (blue arrow)
- Quick action buttons: **Approve** (green), **Reject** (red), **Defer** (amber)
- **AI revision loop:** Send button triggers `POST /api/approvals/revise` — sends original proposal + user feedback to the gateway (GPT-5.1 codex mini via `lib/approval-revision.ts`). AI returns revised title + context. Approval updates **in-place** staying "Pending" with revised proposal. Feedback history accumulates in `response` field (AEST-timestamped, `---`-separated). Card shows "Revising..." badge + blue ring during processing. Users can revise multiple times before making a final decision.
- **Final decisions:** Approve/Reject/Defer call `respondApprovalApi()` → updates approval status + logs activity. These are terminal actions that resolve the approval.
- **Side effects on resolve:** Task-linked approvals auto-delete (reject) or promote to "To Be Scheduled" + create comment (approve); lead-linked trigger pipeline; LinkedIn-linked update action status.

**Sorting:** Priority-sorted (Urgent first, then High, Medium, Low). Within same priority, newest first.

**Sidebar badge:** The Approvals nav item in the Sidebar shows a red badge with the pending count. This is powered by `useApprovals()` which polls `GET /api/approvals/count` every 30 seconds.

**Data source:** `useApprovals()` hook → `services/approval.service.ts` → `GET/POST/PATCH/DELETE /api/approvals`

### 13.2 Memory Page — `app/memory/page.tsx`

Browse, search, edit, and manage workspace files from `~/.openclaw/workspace/`.

**Layout:** Two-column layout — category sidebar (left) + file list/detail (right). Suggestion banner above file grid when pending suggestions exist.

**Categories:** 7 categories mapped via `DIR_MAP` in `lib/workspace.ts`: Core (root `.md` files), Business (`business/`, `tmp/`), Orchestration (`orchestration/`), Memory (`memory/`), Research (`research/`, `transcripts/`, `drafts/`), Projects (`projects/`), Other (uncategorised). Reverse map `CATEGORY_DIRS` powers scoped scanning.

**Components in `components/memory/`:**

**MemoryCategoryNav — `components/memory/MemoryCategoryNav.tsx`:**
- Accepts `counts: Record<string, number>` prop (lightweight, no file reads)
- 7 categories + "All Files" tab
- Hides categories with 0 files
- Icons per category (FileCode, Building2, Workflow, Brain, Search, FolderOpen, FileText)

**MemoryCard — `components/memory/MemoryCard.tsx`:**
- File title (filename with `-`/`_` replaced by spaces), category badge, excerpt (200 chars)
- **Staleness indicator:** Coloured left border — green (< 30d), amber (30-60d), red (> 60d) via `getStaleness()` in `lib/utils.ts`
- **Search highlighting:** `query` prop triggers `<mark>` tags on matching text in excerpts
- Click to open detail view

**MemoryBrowser — `components/memory/MemoryBrowser.tsx`:**
- Search input with **300ms debounce**
- Suggestion banner (`MemorySuggestionBanner`) above grid
- File grid (filterable by category and search)
- Lazy-loads cross-references when detail panel opens
- Passes `onSave`, `referencedBy`, `onSelectRef` to MemoryDetail

**MemoryDetail — `components/memory/MemoryDetail.tsx`:**
- Full markdown content rendered with `react-markdown`
- **Staleness dot** (green/amber/red) next to timestamp in header
- **Inline editing:** Pencil button → `MemoryEditor` textarea → Save/Cancel buttons. PUT `/api/memory/[id]` writes file + auto-commits via `lib/workspace-git.ts`
- **Cross-references:** "Referenced by" section shows clickable links to files that mention this file
- **Version history:** Collapsible `MemoryHistory` component loads git log on demand. Clicking a commit shows `MemoryDiffView` (unified diff with green/red line colouring)

**MemoryEditor — `components/memory/MemoryEditor.tsx`:**
- Auto-resizing monospace textarea for editing markdown content

**MemoryHistory — `components/memory/MemoryHistory.tsx`:**
- Collapsible timeline of git commits (hash, message, relative date)
- Click a commit to load and display the diff

**MemoryDiffView — `components/memory/MemoryDiffView.tsx`:**
- Renders unified diff output with `+` lines green, `-` lines red, `@@` lines blue

**MemorySuggestionBanner — `components/memory/MemorySuggestionBanner.tsx`:**
- Expandable amber banner showing count of pending memory suggestions
- Renders `MemorySuggestionCard` for each suggestion

**MemorySuggestionCard — `components/memory/MemorySuggestionCard.tsx`:**
- Title, reason, content preview, category/source badges
- Approve (writes file to workspace) / Dismiss buttons

**SaveToMemoryModal — `components/memory/SaveToMemoryModal.tsx`:**
- Reusable modal with two modes: "New file" (category dropdown + filename) or "Append to existing" (searchable file dropdown)
- Content textarea, Save/Cancel buttons
- Used from Chat (BookmarkPlus on assistant messages), Briefs (BookmarkPlus in expanded view), Content (BookmarkPlus in draft viewer header)

**Performance — Lazy Category Loading:**
- `getCategoryCounts()` in `lib/workspace.ts` — readdir + stat only, no `readFile`. Returns `Record<category, number>`.
- `listCategoryFiles(category)` — only scans relevant subdirectories for the selected category
- `listWorkspaceFiles()` (no category) only called for "All Files" tab
- API: `GET /api/memory?counts=true` returns counts without file content

**Write Operations — `lib/workspace-write.ts`:**
- `writeWorkspaceFile(relativePath, content)` — overwrites existing file
- `createWorkspaceFile(relativePath, content)` — creates file + directories
- `appendWorkspaceFile(relativePath, content)` — appends to existing file
- All use `safePath()` with path traversal protection (rejects `..` and absolute paths)

**Version History — `lib/workspace-git.ts`:**
- Uses `execFile` (not `exec`) to prevent shell injection
- `assertHash()` validates git hashes (hex + `~^` only)
- `ensureGitRepo()` — idempotent git init
- `commitFile(relativePath, message)` — auto-called after PUT saves (non-fatal on failure)
- `getFileHistory(relativePath)` — returns git log entries
- `getFileDiff(relativePath, fromHash, toHash)` — returns unified diff

**Memory Suggestions — `lib/db-memory-suggestions.ts`:**
- SQLite table `memory_suggestions` (id, title, content, sourceType, sourceId, reason, status, targetCategory, targetFile, createdAt)
- Status: `pending` | `approved` | `dismissed`
- CRUD with activity logging (entity type `"memory"`)
- API: `GET/POST/PATCH/DELETE /api/memory/suggestions`. PATCH with `status: "approved"` auto-writes content to workspace.

**Data flow:**
- `useMemory()` hook → `services/memory.service.ts` → `GET /api/memory` (list), `GET /api/memory?counts=true` (counts), `GET /api/memory?refs=true` (cross-refs), `GET /api/memory/[id]` (detail), `PUT /api/memory/[id]` (edit), `POST /api/memory` (create/append)
- `useMemorySuggestions()` hook → `GET/PATCH /api/memory/suggestions`
- `useSaveToMemory()` hook → manages SaveToMemoryModal state
- Version history: `GET /api/memory/[id]/history`, `GET /api/memory/[id]/diff?from=<hash>&to=<hash>`

### 13.3 Activity Page — `app/activity/page.tsx`

Full timeline of all CRUD actions across tasks, goals, content, and approvals.

**Layout:** PageHeader ("Activity") → filter chips → date-grouped timeline

**Components to create in `components/activity/`:**

**ActivityFilters — `components/activity/ActivityFilters.tsx`:**
- FilterBar with entity type chips: All, Tasks, Goals, Content, Approvals, Briefs, Heartbeats, Memory, Projects
- Click to filter the timeline

**ActivityTimeline — `components/activity/ActivityTimeline.tsx`:**
- Date-grouped sections (e.g., "Today", "Yesterday", "Mon, 10 Feb")
- Dashed vertical line connecting items within a group
- "Load more" button at bottom (offset-based pagination, not infinite scroll)

**ActivityTimelineItem — `components/activity/ActivityTimelineItem.tsx`:**
- Icon (color-coded by entity type: blue for tasks, green for goals, purple for content, orange for approvals, cyan for chat, amber for briefs, pink for heartbeats, emerald for memory, indigo for projects)
- Entity name (linked to the relevant page via `ENTITY_ROUTES` map)
- Action description (e.g., "Status: To Do → In Progress")
- **Source badge** — inline badge for non-dashboard sources (e.g., "cron", "openclaw", "api")
- Relative timestamp
- **Expandable field-level diffs** — click to show `changes` JSON parsed as `{ field: [oldValue, newValue] }` pairs

**Data source:** `useActivity()` hook → `services/activity.service.ts` → `GET /api/activity?entityType=<type>&limit=20&offset=0`

### 13.4 Global Search — Cmd+K

Searchable from any page. Opens a modal dialog, searches across all entity types.

**Components to create in `components/search/`:**

**SearchDialog — `components/search/SearchDialog.tsx`:**
- Modal overlay triggered by `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- Search input with autofocus
- Results grouped by type (Goals, Tasks, Content, Approvals, Documents, Memory)
- Keyboard navigation: arrow keys to move, Enter to select, ESC to close
- Click or Enter navigates to the item's page

**SearchResultItem — `components/search/SearchResultItem.tsx`:**
- Icon by type, title, subtitle (description/excerpt), page link
- Highlighted state for keyboard-selected item

**Hook: `hooks/useGlobalSearch.ts`:**
- Debounced search (300ms)
- Calls `searchGlobalApi(query)` → `GET /api/search?q=<query>`
- Returns results grouped by type
- Manages keyboard navigation state (selected index, open/close)

**API: `GET /api/search?q=<query>`:**
- Searches across all 6 tables + memory files
- Returns `SearchResult[]` with type, id, title, subtitle, href
- Limits results per type (e.g., 5 per category)

**Integration with layout:**
- `SearchDialog` is rendered in `app/layout.tsx` (outside the main flex container)
- Global keyboard listener for Cmd+K / Ctrl+K

---

## Verification

- [x] Approvals page shows priority-sorted list with colored left borders
- [x] Expanding an approval card shows full context
- [x] Send button triggers AI revision loop — proposal updates in-place, approval stays Pending
- [x] Revision feedback history shown in blue panel when pending approval has prior feedback
- [x] "Revising..." badge + blue ring shown during AI processing
- [x] Approve/Reject/Defer resolve the approval as final decisions
- [x] Approval responses logged in activity table
- [x] Sidebar Approvals badge shows pending count, auto-updates every 30s
- [x] Memory page shows category sidebar with lightweight counts (no file reads)
- [x] Switching categories only loads that category's files (lazy loading)
- [x] Search input filters memory files with 300ms debounce and highlights matches
- [x] Clicking a memory file shows full markdown rendered content
- [x] Cards show coloured staleness borders (green/amber/red) and age text
- [x] Click edit in detail panel → textarea appears → save writes file + auto-commits
- [x] Detail panel shows "Referenced by" links to files that mention the current file
- [x] Chat/Brief/Content pages show "Save to Memory" BookmarkPlus button → modal → save works
- [x] Suggestion banner appears when pending suggestions exist; Approve writes file, Dismiss removes
- [x] Detail panel shows collapsible version history; clicking a commit shows diff
- [ ] Activity page shows date-grouped timeline with dashed vertical line
- [ ] Entity type filter chips filter the timeline (9 types: tasks, goals, content, approvals, briefs, heartbeats, memory, projects, MCP)
- [ ] Non-dashboard activity items show source badge (cron, openclaw, api)
- [ ] Expanding an activity item shows field-level diffs
- [ ] "Load more" pagination works
- [ ] Cmd+K opens search dialog from any page
- [ ] Search returns results across goals, tasks, content, approvals, documents, memory
- [ ] Arrow keys navigate results, Enter selects, ESC closes
