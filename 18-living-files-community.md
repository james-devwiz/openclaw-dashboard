# Phase 18: Living Files Philosophy & Community Notes

## Goal

Understand the philosophy that makes this setup powerful, configure overnight autonomous work, and run through the full verification checklist to confirm everything is working.

---

### 18.1 Living Files Philosophy

One concept that makes this setup powerful: **living files**.

Instead of information existing only in chat context (which gets lost), every piece of research, every meeting summary, every business insight is saved as a markdown file. These files are:

- **Searchable** via memory search
- **Persistent** across sessions
- **Growing** — updated when new info is found
- **Organised** — business research in `business/research/`, tech in `research/`, meetings in `research/meetings/`

Your AI should check for existing files before researching a topic. If a file exists, it updates it rather than creating a duplicate.

Over time, your workspace becomes a comprehensive, AI-searchable knowledge base — your second brain.

### 18.2 Overnight Autonomous Work

Configure your AI to work while you sleep. Add to AGENTS.md:

```markdown
## Overnight Work Protocol

During quiet hours:
1. Review today's conversations for unfinished threads
2. Research topics mentioned but not explored
3. Save all findings as living files in research/
4. Check for trending news relevant to the business
5. Suggest workflow improvements
6. Prepare morning brief content

Rules:
- Never send messages during quiet hours
- Create PRs for code changes — never push directly
- Write findings to files, not just context
- Use cheapest model for overnight work
```

### 18.3 Business Meta-Analysis (Weekly "AI Council")

One of the most powerful features. The `business-meta-analysis` cron job (configured in Phase 5) runs weekly and:

1. Ingests signals: meeting transcripts, email patterns, task completion rates, project status
2. Analyses through four expert perspectives:
   - **Growth Strategist** — opportunities, market trends
   - **Revenue Guardian** — revenue health, pipeline
   - **Skeptical Operator** — risks, things being overlooked
   - **Efficiency Analyst** — workflow bottlenecks, time sinks
3. Perspectives debate and reconcile
4. Produces a ranked list of actionable insights
5. Delivered Monday morning to Telegram

### 18.4 Cost Tracking

Use the `model-usage` skill to track costs:

```bash
openclaw skills list
openclaw skills check model-usage
```

> **Note:** The `model-usage` skill requires macOS + codexbar CLI — it's not VPS-compatible. Use the weekly cost report cron job (Phase 5) for VPS-based cost tracking.

### 18.5 Community Notes

This plan is designed for the AI Orchestrators community. A few things to keep in mind:

- **Start with Phase 2 (Context Engineering).** It's the single highest-impact change. Even if you do nothing else, this transforms your AI's usefulness.
- **Telegram topics are optional but powerful.** If you prefer Slack, everything works there too — you just lose the topic organisation.
- **The business meta-analysis is a differentiator.** Most people aren't doing this. Having an AI council review your business weekly is genuinely novel.
- **Budget control matters.** The model routing strategy (cheap for routine, mid-tier for complex, premium for strategic) keeps costs predictable. Don't let your AI burn through premium model tokens on routine tasks.
- **Overnight work is where the magic happens.** Waking up to find your AI has researched three topics, prepared your morning brief, and suggested workflow improvements is the "wow" moment.

Share your setup in the community. Compare cron job configurations. Share useful workspace file patterns. This is a team sport.

---

## Full Verification Checklist

After completing all phases, every one of these should be true:

### Core System (Phases 1–6)

- [ ] All 11 workspace files present and populated on VPS (`~/.openclaw/workspace/`)
- [ ] IDENTITY.md, SOUL.md, AGENTS.md, USER.md, TOOLS.md, HEARTBEAT.md, MEMORY.md, BOOT.md, GOALS.md, APPROVALS.md, CONTENT.md
- [ ] Timezone set under `agents.defaults.userTimezone`
- [ ] Telegram bot responding in DMs and all topic threads
- [ ] `channels.telegram` configured (not `plugins.telegram`)
- [ ] `plugins.entries.telegram.enabled` set to `true`
- [ ] Memory search enabled (`memory.search: true`)
- [ ] Heartbeat running during active hours (check with `openclaw health`)
- [ ] Heartbeat configured under `agents.defaults.heartbeat` with `every` duration string (recommend `"30m"`)
- [ ] HEARTBEAT.md includes pre-meeting brief and post-meeting report sections
- [ ] Morning brief delivered at your wake time with data from both calendars, Slack, Teams, Reclaim
- [ ] Morning brief saved to Command Centre `/api/briefs` (check Briefs & Reports page)
- [ ] All cron jobs listed: `openclaw cron list` (11+ jobs)
- [ ] Cron jobs managed via CLI (`openclaw cron add`), not JSON config
- [ ] Google Calendar: `gog calendar events primary --account default` works (note `--account default` flag)
- [ ] Outlook Calendar: `outlook-calendar today` returns events
- [ ] Email readable (Gmail + Outlook if configured)
- [ ] Slack Reader: `slack-reader unread --limit 5` works
- [ ] Teams Reader: `teams-reader chats --limit 5` works
- [ ] Fathom: `fathom-meetings list` works
- [ ] Reclaim: `reclaim-tasks list --limit 5` works
- [ ] Web search working (Brave or Perplexity)
- [ ] Config backup running nightly (check crontab)

### Dashboard (Phases 7–13)

- [ ] Dashboard accessible at `localhost:18790` via SSH tunnel
- [ ] `systemctl status openclaw-dashboard` shows active/running
- [ ] **Overview:** stat cards, channel status, system resources (color-coded), activity feed, goals progress, pending approvals
- [ ] **Chat:** 7 topic selector works with separate contexts per topic
- [ ] **Chat:** Messages stream progressively (SSE streaming)
- [ ] **Chat:** HTTP API enabled (`gateway.http.endpoints.chatCompletions.enabled: true`)
- [ ] **Goals & Tasks:** Create a goal, see it in grid with progress ring
- [ ] **Goals & Tasks:** Create a task linked to a goal, see it in kanban
- [ ] **Goals & Tasks:** Selecting a goal filters the kanban board
- [ ] **Goals & Tasks:** Drag task between columns updates status
- [ ] **Content Centre:** Create content item, drag through 6 pipeline stages
- [ ] **Content Centre:** Calendar view shows scheduled content
- [ ] **Content Centre:** Draft viewer slide-over renders markdown
- [ ] **Approvals:** Items render with priority-colored left borders
- [ ] **Approvals:** Respond via text input + quick action buttons (Approve/Reject/Defer)
- [ ] **Approvals:** Sidebar badge shows pending count, auto-updates every 30s
- [x] **Memory:** Workspace files appear categorised with search (300ms debounce)
- [x] **Memory:** Detail view renders markdown with `react-markdown`
- [x] **Memory:** Lazy per-category loading (lightweight counts sidebar, scoped file scanning)
- [x] **Memory:** Staleness indicators (green/amber/red left borders based on file age)
- [x] **Memory:** Inline editing with save/cancel (auto git commit on save)
- [x] **Memory:** Search keyword highlighting in excerpts
- [x] **Memory:** Cross-reference "Referenced by" links in detail panel
- [x] **Memory:** Save to Memory from Chat, Briefs, and Content pages (BookmarkPlus button)
- [x] **Memory:** Automated memory suggestions with approve/dismiss workflow
- [x] **Memory:** Version history with collapsible git log and unified diff view
- [ ] **Activity:** Date-grouped timeline with expandable field-level diffs
- [ ] **Activity:** Entity type filter chips work
- [ ] **Activity:** Load-more pagination works
- [ ] **Cmd+K Search:** Opens on every page, returns results across all sections
- [ ] **Cmd+K Search:** Keyboard navigation (arrows, Enter, ESC)
- [ ] **Morning Brief:** Structured cards with left-border accents
- [ ] **Cron Status:** Card grid with trigger buttons

### Projects (Phase 14)

- [ ] Projects page shows grid of project cards
- [ ] Create a project with name and description
- [ ] Project detail page has Chat, Instructions, and Knowledge Base tabs
- [ ] Instructions editor saves on blur/debounce
- [ ] File picker shows workspace files to link
- [ ] Linked files appear in Knowledge Base tab with remove option
- [ ] Project chat works with SSE streaming (server-side context injection)
- [ ] Chat responses reference linked file contents and follow project instructions
- [ ] Updating instructions mid-conversation takes effect on next message
- [ ] Multiple chat sessions per project, isolated from each other
- [ ] Deleting a project cascades to linked files and chat sessions

### MCP Management (Phase 15)

- [ ] Architecture page has MCP tab (between Skills and Architecture)
- [ ] Can add an MCP server (stdio or SSE transport)
- [ ] "Test Connection" returns healthy status
- [ ] "Sync Tools" discovers tools from the server
- [ ] Tools catalogue shows schemas and "Try it" invocation works
- [ ] Observability shows call logs and stats
- [ ] `~/.mcporter/mcporter.json` auto-generated on server changes

### Skill Management (Phase 16)

- [ ] Skills tab shows toggle switch on ready/disabled skills
- [ ] Toggle disables a skill (yellow "disabled" badge, gateway restarts)
- [ ] Toggle re-enables a disabled skill (green "ready" badge)
- [ ] "Disabled" filter tab shows correct count
- [ ] Missing skills show "Install" button (where installer specs exist)
- [ ] Install modal shows available installers from SKILL.md frontmatter
- [ ] `brew`-kind specs marked as unavailable on Linux VPS
- [ ] `go`/`npm` installs execute and return success/error

### Database

- [ ] `~/.openclaw/mission-control.db` exists with tables (tasks, goals, content, approvals, activities, chat sessions/messages, briefs, heartbeats, documents, cron_goals, memory_suggestions, projects, project_files, chat_read_cursors, mcp_servers, mcp_tools, mcp_bindings, mcp_call_logs)
- [ ] Default "General" goal auto-created
- [ ] Activity logging works (creating/updating entities generates activity records)
- [ ] Existing tasks auto-assigned to General goal

### Security & Operations

- [ ] Gateway token rotated from default
- [ ] Dashboard bound to `127.0.0.1` (not exposed to internet)
- [ ] Elevated permissions restricted to your user IDs only
- [ ] No unlayered CSS resets in `globals.css`
- [ ] AI responds contextually (*"Who am I?"* returns rich context)
- [ ] Overnight work producing living files in `research/`

---

*Built by the AI Orchestrators community. Deploy it, customise it, make it yours.*
