# Phase 10: Overview, Cron Status & Briefs

## Goal

Build three dashboard pages: the Overview homepage with stat cards and activity feed, the Cron Status page with job cards and trigger buttons, and the Morning Brief page with sectioned brief cards. These pages are primarily read-only views that display data from the gateway and database.

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

---

### 10.1 Overview Page — `app/page.tsx`

The homepage provides a single-screen summary of the entire system.

**Layout:** PageHeader ("Overview") → stat cards grid → two-column layout (left: system info, right: activity + goals + approvals)

**Components to create in `components/overview/`:**

**StatusCards** — Grid of stat cards showing key metrics:
- Gateway status (healthy/down)
- Active channels count
- Pending approvals
- Active goals count
- Each card: `rounded-xl border border-border bg-card p-6` with `text-2xl font-bold` value and `text-muted-foreground` label

**ChannelStatusCard** — Shows connected channels (Slack, Telegram, Notion) with green/red status indicators.

**SystemResourcesCard** — Color-coded progress bars for disk, memory, CPU:
- Green when value < 60%
- Amber when value 60–80%
- Red when value > 80%
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`

**ActivityFeed** — Compact timeline of the last 8 activity items:
- Each item shows: icon (color-coded by entity type), entity name, action description, relative time
- Links to the full Activity page
- Uses `formatRelativeTime()` from `lib/utils.ts`

**GoalsProgressCard** — Compact view of active goals with inline ProgressRing components.

**PendingApprovalsCard** — Shows count + list of recent pending approval titles with priority badges.

**Data sources:**
- `useGateway()` hook for health, config, system resources (polls every 30s)
- `useActivity()` hook for recent activity (limit: 8)
- `useGoals()` hook for active goals
- `useApprovals()` hook for pending count

### 10.2 Cron Status Page — `app/cron/page.tsx`

Card grid showing all cron jobs and their status.

**Layout:** PageHeader ("Cron Jobs") → grid of cron job cards

**Each card shows:**
- Job name (prominent)
- Status badge (CVA Badge — `success` for last-success, `error` for last-failure, `warning` for running)
- Model badge (secondary Badge showing which model)
- Cron schedule in human-readable format
- Next run time (prominent, formatted with `formatDate()` + `formatTime()`)
- Target channel/topic (if configured)
- **Trigger button** — calls `triggerCronJobApi(jobName)`, shows loading spinner while running

**Data source:** `useCron()` hook → `services/gateway.service.ts` → `GET /api/cron`

The `/api/cron` route runs `openclaw cron list` on the VPS and parses the output. The POST route triggers a specific job by name.

### 10.3 Briefs & Reports Page — `app/brief/page.tsx`

> **Updated:** Originally a simple "Morning Brief" card layout. Now a full dual-view page with search, filtering, and kind/type differentiation.

Displays all briefs and reports with two views: Calendar (per-day navigation) and Table (search/filter/sort).

**Layout:** PageHeader ("Briefs & Reports") with Calendar/Table view toggle → delegated to `BriefCalendarView` or `BriefTableView`.

**Kind system** — 10 brief types grouped into 2 kinds:
- **Briefs**: Morning Brief, Pre-Meeting Brief
- **Reports**: End of Day Report, Post-Meeting Report, Weekly Review, Business Analysis, Cost Report, Error Report, Self-Improvement Report, Custom

**Sources**: `cron` | `heartbeat` | `manual` | `api`

**Calendar view** (`components/briefs/BriefCalendarView.tsx`):
- `BriefDateNav` for day-by-day navigation with jump-to-date
- `BriefListItem` cards with expand/collapse (Framer Motion), type badge, time
- Date mismatch indicator: amber "(generated Sat 15 Feb)" when `brief.date` differs from AEST date of `createdAt`

**Table view** (`components/briefs/BriefTableView.tsx`):
- `BriefKindTabs` — All / Briefs / Reports top-level filter
- `BriefSearchBar` — search input (300ms debounce) + from/to date pickers + source dropdown
- `BriefTypeTabs` — type tabs with count badges, filtered by active kind
- `BriefStats` — colour-coded type breakdown pills
- `BriefTable` — sortable by date/time, expandable inline detail rows, delete action
- `BriefPagination` — prev/next with "Showing X–Y of Z"

**Search API**: `GET /api/briefs?mode=search` with params: `kind`, `briefType`, `source`, `search`, `sortBy`, `sortDir`, `limit`, `offset`. Returns `{ briefs, total, typeCounts }`.

**DB functions** (`lib/db-briefs.ts`): `searchBriefs()`, `countBriefs()`, `getBriefTypeCounts()` with shared `buildWhere()` helper supporting `kind` expansion to `IN (...)` clause.

**Shared constants** (`lib/brief-constants.ts`): `TYPE_COLORS`, `TYPE_SHORT_LABELS`, `TYPE_KIND`, `BRIEF_TYPES`, `REPORT_TYPES`.

**Unread tracking:** Reuses `chat_read_cursors` table with synthetic topic `"_briefs"`. `getUnreadBriefCount()` counts briefs created after cursor. `markBriefsRead()` upserts cursor to now. API: `GET/POST /api/briefs/unread`. Hook: `useBriefUnread` (30s polling). Sidebar red badge on "Briefs & Reports" when count > 0. Visiting the page calls `markRead()`.

**Data source:** SQLite `briefs` table. Populated by cron jobs (morning-brief, evening-summary, weekly-review, etc.), heartbeat (pre/post-meeting), chat (`:::brief` markers), and manual API calls.

---

## Verification

- [ ] Overview page loads with stat cards showing real data from gateway
- [ ] System resources card shows color-coded progress bars (green/amber/red)
- [ ] Channel status shows connected/disconnected for each channel
- [ ] Activity feed shows last 8 items with relative timestamps
- [ ] Goals progress card shows active goals with progress rings
- [ ] Pending approvals card shows count and recent titles
- [ ] Cron page shows all cron jobs as cards with status badges
- [ ] Cron trigger buttons work — clicking triggers the job on VPS
- [ ] Briefs page Calendar view shows briefs per day with date mismatch indicators
- [ ] Briefs page Table view shows kind tabs, type tabs, search, date range, source filter, pagination
- [ ] Kind filter (Briefs/Reports) correctly filters type tabs and results
- [ ] All pages use PageHeader component
- [ ] Data refreshes automatically (gateway polls every 30s)
