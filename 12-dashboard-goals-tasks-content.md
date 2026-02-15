# Phase 12: Dashboard Pages — Goals, Tasks & Content Centre

## Goal

Build three interconnected views: a Goals grid with category filtering and bidirectional task/recurring counts, a 7-column Kanban task board with drag-and-drop, comments, relations, activity history, and task-approval linking, and a 6-stage Content pipeline with calendar view and draft viewer.

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
- Source badge (Manual, Cron, Heartbeat, Meeting, Brain Dump, Approval)
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
4. **TaskCommentSection** — comment thread (`GET/POST /api/comments?taskId=xxx`) with source attribution (user vs openclaw). Comments stored in `comments` table

Header includes delete button (`Trash2` icon with `window.confirm()` guard).

**Filtering:**
- When a goal is selected in the grid above, the kanban filters to show only that goal's tasks
- "All Tasks" option to show everything
- `GET /api/tasks?goalId=<id>` for filtered queries

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

### 12.4 Content Centre — `app/content/page.tsx`

**Layout:** PageHeader ("Content Centre") with "New Content" and view toggle (Pipeline/Calendar) → pipeline board or calendar view

**Components to create in `components/content/`:**

**ContentPipelineBoard — `components/content/ContentPipelineBoard.tsx`:**
- 6-stage horizontal pipeline using `PipelineColumn` components:
  1. **Idea** — initial concept
  2. **Research** — gathering information
  3. **Draft** — writing in progress
  4. **Review** — ready for review (creates approval if AI-generated)
  5. **Published** — live content
  6. **Filed** — archived/reference

- Drag-and-drop between stages (same pattern as kanban)
- Stage changes trigger `stage_changed` activity logging

**ContentCard — `components/content/ContentCard.tsx`:**
- Content title, type badge (YouTube Script, Newsletter, Blog Post, etc.)
- Platform badge, priority indicator
- Scheduled date (if set)
- Source badge (AI Suggestion, Manual, Trending, etc.)
- Click to open draft viewer slide-over

**ContentCalendar — `components/content/ContentCalendar.tsx`:**
- Monthly calendar grid showing content items by `scheduledDate`
- Color-coded by content type or stage
- Toggle between Pipeline and Calendar views

**ContentDraftViewer — `components/content/ContentDraftViewer.tsx`:**
- Slide-over panel (from right side)
- Shows full content details: title, type, topic, research notes, draft text
- Draft rendered with `react-markdown`
- Edit fields for topic, research notes, draft
- Stage selector dropdown
- Close on ESC or click outside

**Data source:** `useContent()` hook → `services/content.service.ts` → `GET/POST/PATCH/DELETE /api/content`

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
- [ ] Recurring table shows cron jobs with sortable columns
- [ ] Goal dropdown on recurring rows links/unlinks correctly
- [ ] Clicking "Run" triggers the cron job
- [ ] Content pipeline shows 6 stages with drag-and-drop
- [ ] Dragging content between stages updates the stage
- [ ] Calendar view shows content items by scheduled date
- [ ] Draft viewer slide-over opens on card click, renders markdown
- [ ] New Goal, New Task, and New Content creation forms all work
- [ ] Every task belongs to a goal (default "General" if unassigned)
