# Phase 12: Goals & Tasks

## Goal

Build two interconnected views: a Goals grid with category filtering and bidirectional task/recurring counts, and a 7-column Kanban task board with drag-and-drop, comments, relations, activity history, and task-approval linking.

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

---

### 12.1 Goals Page — `app/goals/page.tsx`

**Layout:** PageHeader ("Goals & Tasks") with "New Goal" action button → category filter bar → goals grid → task kanban board below → recurring task table at the bottom

The Goals, Tasks, and Recurring Tasks views live on the same page. Selecting a goal filters the kanban board below.

**Components to create in `components/goals/`:**

**GoalFilters — `components/goals/GoalFilters.tsx`:**
- Category filter chips: All, Personal, System, Njin, Devwiz, AI Orchestrators
- Clicking a chip filters the goals grid by `category` field
- "All" shows every goal

**GoalCard — `components/goals/GoalCard.tsx`:**
- `rounded-xl border border-border bg-card p-6` with `hover:shadow-md transition-all duration-200`
- ProgressRing showing goal progress
- Goal name (`font-semibold`), description (truncated), category badge (colour-coded by category), priority badge
- **Task counts:** "X tasks" (standard) + "Y recurring" (cron-linked) — data from `goal.taskCount` and `goal.recurringCount`
- Target date and status indicator
- Click to select (highlights card, filters kanban below)
- Edit/delete action menu

**Category badge variants:**
- Personal → `secondary`
- System → `default`
- Njin → `default`
- Devwiz → `success`
- AI Orchestrators → `warning`

**Goals Grid:**
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Selected goal has visual highlight (ring or border accent)
- "New Goal" opens a create form (modal or inline)

**CreateGoalManualForm:**
- Name, description, category dropdown (Personal, System, Njin, Devwiz, AI Orchestrators — default Personal), status, priority, target date, metric fields

**Data source:** `useGoals()` hook → `services/goal.service.ts` → `GET/POST/PATCH/DELETE /api/goals`

**Goals API enrichment:** GET endpoint computes `taskCount` (from tasks table, grouped by goalId) and `recurringCount` (from cron_goals bridge table) per goal.

### 12.2 Tasks Kanban — embedded in Goals page

**Layout:** 7-column kanban board below the goals grid

**Kanban Columns:**
1. **Backlog** — tasks not yet scheduled
2. **To Do This Week** — tasks scheduled for the current week
3. **In Progress** — actively being worked on
4. **Requires More Info** — waiting for information
5. **Blocked** — tasks with blockers
6. **Needs Review** — completed work awaiting review
7. **Completed** — done

Each column uses a card-based layout with task count badge in the header.

**TaskKanbanCard:**
- Priority badge (CVA Badge — `error` for High, `warning` for Medium, `secondary` for Low)
- Task name, category, due date
- Source badge (Manual, Cron, Heartbeat, Meeting, Brain Dump, Approval, Chat)
- Approval badge — if `task.approvalId` exists, show amber `Clock` for Pending or green `Check` for Approved
- Drag handle for reordering
- Hover-visible delete icon (`Trash2`, `opacity-0 group-hover:opacity-100`, `e.stopPropagation()`)

**Drag and Drop:**
- Drag tasks between columns to change status
- Uses HTML drag-and-drop API (no heavy library needed)
- `.kanban-card-dragging` class applied during drag (opacity + rotation, defined in globals.css)
- Status updates via `updateTaskStatusApi()` → triggers activity logging

**TaskSlideOver — `components/tasks/TaskSlideOver.tsx`:**
Click a task card to open a slide-over panel with 4 sections:

1. **TaskSlideOverFields** — name, expandable description (`rows={4}`, `resize-y`, `min-h-[80px]`), status, priority, category, due date, source, goal dropdowns
2. **TaskRelationsSection** — linked goal (name + badge), linked approval (title + status badge if present), sibling tasks (other tasks in same goal), content items (linked to same goal). Collapsible with `Link2` icon
3. **TaskActivitySection** — per-task activity timeline using existing `ActivityTimeline` component. Fetches via `GET /api/activity/entity?entityType=task&entityId=xxx`
4. **TaskCommentSection** — comment thread (`GET/POST /api/comments?taskId=xxx`) with source attribution (user vs openclaw). Comments stored in `comments` table, sorted newest-first. **AI review flow:** Takes `taskStatus` prop from TaskSlideOver. When task status changes to "Needs Review", auto-calls `POST /api/comments/review` which generates a review summary via `lib/task-review.ts` (non-streaming gateway call, `gpt-5.1-codex-mini`). When user replies on a "Needs Review" task, auto-calls `POST /api/comments/reply` which generates an AI reply addressing the feedback. Thinking indicator ("Jimmy AI is reviewing...") shown during AI calls. Uses refs to track status transitions and prevent duplicate triggers. Service functions: `requestReviewSummaryApi()`, `requestReviewReplyApi()` in `comment.service.ts`

Header includes delete button (`Trash2` icon with `window.confirm()` guard).

**Filtering:**
- When a goal is selected in the grid above, the kanban filters to show only that goal's tasks
- "All Tasks" option to show everything
- `GET /api/tasks?goalId=<id>` for filtered queries

**Chat-delegated tasks:**
- Tasks with `source: "Chat"` are auto-created by `lib/chat-task-detect.ts` when a user delegates complex work in the chat interface
- Created with status "In Progress", assignee "Jimmy AI", priority "Medium"
- On successful AI response, task moves to "Needs Review"; on empty response, task stays "In Progress" for retry
- See Phase 11 (section 11.10) for detection logic and wiring details

**Task-Approval linking:**
- Tasks with `source: "Approval"` have an `approvalId` linking to the approvals table
- Approvals have `relatedTaskId` linking back
- Rejecting an approval → auto-deletes linked task
- Approving with response text → auto-creates comment on linked task

**Data source:** `useTasks()` hook → `services/task.service.ts` → `GET/POST/PATCH/DELETE /api/tasks`

### 12.3 Recurring Tasks — embedded below kanban

**Layout:** Table of VPS cron jobs with goal linking and sortable columns

**RecurringTable → RecurringDesktop + RecurringMobile:**
Split into 4 files for 200-line limit:
- `RecurringTable.tsx` (parent) — hooks, sort state, empty state
- `RecurringDesktop.tsx` — desktop table with sortable column headers
- `RecurringMobile.tsx` — mobile card layout
- `recurring-shared.ts` — shared types, STATUS_CONFIG, buildChannels helper

**Features:**
- **Sortable columns:** "Last Run" and "Next Run" — click header to toggle asc/desc. Default: Next Run ascending. Jobs without timestamps sort to bottom.
- **Goal linking:** Inline `<select>` dropdown per row. Links cron job to a goal via `cron_goals` bridge table. PATCH `/api/cron` to set.
- **Expandable rows:** Click row to show prompt text, model, schedule details
- **Trigger button:** "Run" button per job (with 3s "Triggered" confirmation state)
- **Status badges:** success (green), failure (red), running (blue with spin)

**Data source:** `useCron()` hook → `services/gateway.service.ts` → `GET/PATCH /api/cron`

---

> **Content pipeline:** Content creation and publishing is handled by Content Studio (Phase 21). This phase focuses on goals, tasks, and recurring task management only.

---

## Verification

- [ ] Goals grid shows all goals with progress rings and category badges
- [ ] Category filter chips (All/Personal/System/Njin/Devwiz/AI Orchestrators) filter the grid
- [ ] Goal cards show task count + recurring count
- [ ] Creating a new goal works with correct category options (default Personal)
- [ ] Selecting a goal highlights the card and filters the kanban below
- [ ] Kanban shows 7 columns: Backlog, To Do This Week, In Progress, Requires More Info, Blocked, Needs Review, Completed
- [ ] Dragging a task between columns updates its status
- [ ] Task status changes are logged in the activity table
- [ ] "All Tasks" shows tasks across all goals
- [ ] Task slide-over opens with 4 sections (fields, relations, activity, comments)
- [ ] Task description textarea is expandable (resize-y)
- [ ] Delete button works on both slide-over and kanban card (with confirmation)
- [ ] Approval badge shows on linked task cards
- [ ] Rejecting an approval auto-deletes the linked task
- [ ] Approving with response auto-creates comment on linked task
- [ ] Comments appear newest-first in the comment thread
- [ ] Moving a task to "Needs Review" auto-generates a Jimmy AI review summary comment
- [ ] Thinking indicator ("Jimmy AI is reviewing...") shows during AI comment generation
- [ ] Replying to a comment on a "Needs Review" task triggers an auto-reply from Jimmy AI
- [ ] Non-"Needs Review" tasks do not trigger AI comments
- [ ] Recurring table shows cron jobs with sortable columns
- [ ] Goal dropdown on recurring rows links/unlinks correctly
- [ ] Clicking "Run" triggers the cron job
- [ ] New Goal and New Task creation forms work
- [ ] Every task belongs to a goal (default "General" if unassigned)
