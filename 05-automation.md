# Phase 5: Automation — Heartbeat & Cron Jobs

## Goal

Make your AI proactive with scheduled tasks and periodic monitoring. The heartbeat wakes your AI regularly to check for urgent items. Cron jobs handle recurring tasks like morning briefs, weekly reviews, and overnight maintenance.

---

### 5.1 Enable Heartbeat

The heartbeat wakes your AI every N minutes to check for urgent items. If nothing needs attention, it silently moves on. If something matters, it messages you on Telegram.

Add to `openclaw.json` under `agents.defaults`:

```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "every": "60m",
        "model": "your-cheapest-model",
        "activeHours": {
          "start": "04:00",
          "end": "21:00",
          "timezone": "Your/Timezone"
        },
        "target": "telegram"
      }
    }
  }
}
```

> **Important config notes:**
> - Heartbeat goes under `agents.defaults.heartbeat` (not top-level `heartbeat`)
> - The key is `every` (not `interval`), accepting duration strings like `"30m"`, `"1h"`, etc.
> - There is no `offHoursInterval` — use cron jobs for overnight checks (see off-hours check below)
> - Set `agents.defaults.userTimezone` separately for general timezone awareness

### 5.2 Configure Cron Jobs

Cron jobs are managed via `openclaw cron add` CLI — **not** by editing `openclaw.json` directly. They're stored in `~/.openclaw/cron/jobs.json`. Here's the recommended set — adjust schedules to your timezone.

> **Important:** All cron jobs should save their output to the Command Centre API (`POST /api/briefs` with the appropriate `briefType`) so results appear in the Briefs & Reports page, not just in Telegram. Include a `curl` command at the end of each prompt to save the output.

> **Telegram topic routing:** Use `--channel telegram` and route to specific forum topics by including the delivery string in your prompt instructions (e.g., "deliver to `-CHATID:topic:2`"). See Phase 3 for your topic ID mapping.

```bash
# Morning brief — delivered at wake time
# Includes: weather, BOTH calendars (Google + Outlook), Slack unread, Teams messages,
# Reclaim priorities, overnight work. Saves to Command Centre /api/briefs.
openclaw cron add --name "morning-brief" --cron "0 4 * * *" --tz "Your/Timezone" \
  --session isolated --model gpt --announce --channel telegram \
  --message "Compile morning brief: 1) Weather for your location, 2) Google Calendar (gog calendar events primary --account default --from <today> --to <today-end>), 3) Outlook Calendar (outlook-calendar today), 4) Merge both calendars into single timeline, flag conflicts, 5) Reclaim priorities (reclaim-tasks list --limit 20), 6) Slack unread (slack-reader unread --limit 10), 7) Teams unread (teams-reader chats --limit 10), 8) Overnight work from memory/, 9) 3-day lookahead. Save to Command Centre: curl -s -X POST http://localhost:18790/api/briefs -H 'Content-Type: application/json' -d '{\"briefType\":\"Morning Brief\",\"title\":\"Morning Brief — <date>\",\"date\":\"<YYYY-MM-DD>\",\"content\":\"<FULL BRIEF>\",\"source\":\"cron\"}'"

# Evening summary — end-of-day report
# Includes: both calendars, Fathom meeting summaries, task progress, carry-forward items.
openclaw cron add --name "evening-summary" --cron "0 21 * * *" --tz "Your/Timezone" \
  --session isolated --model gpt --announce --channel telegram \
  --message "Evening summary: 1) Both calendars — meetings that happened today, 2) Fathom (fathom-meetings list --after <today>) — available meeting summaries, 3) Reclaim tasks completed vs open, 4) Key Slack/Teams conversations today, 5) Tomorrow's preview from both calendars, 6) Carry-forward items and daily wins. Save to Command Centre: curl -s -X POST http://localhost:18790/api/briefs -H 'Content-Type: application/json' -d '{\"briefType\":\"End of Day Report\",\"title\":\"End of Day Report — <date>\",\"date\":\"<YYYY-MM-DD>\",\"content\":\"<FULL REPORT>\",\"source\":\"cron\"}'"

# Weekly review (mid-tier model for depth)
openclaw cron add --name "weekly-review" --cron "0 20 * * 0" --tz "Your/Timezone" \
  --session isolated --model sonnet --announce --channel telegram \
  --message "Weekly review: achievements, blockers, patterns, insights. Synthesise daily notes into weekly summary. Update MEMORY.md."

# Memory maintenance (silent)
openclaw cron add --name "memory-maintenance" --cron "0 2 * * *" --tz "Your/Timezone" \
  --session isolated --model gpt \
  --message "Memory maintenance: clean up files, archive old notes, ensure daily note exists."

# Health check every 6h (silent, alerts on failure)
openclaw cron add --name "health-check" --cron "0 */6 * * *" --tz "Your/Timezone" \
  --session isolated --model gpt \
  --message "System health: disk, memory, channels, model access. Alert on Telegram only if issues."

# Self-improvement audit (weekly, mid-tier)
openclaw cron add --name "self-improvement-audit" --cron "0 1 * * 0" --tz "Your/Timezone" \
  --session isolated --model sonnet --announce --channel telegram \
  --message "Review workspace files. Suggest improvements based on past week. Note outdated info."

# Markdown audit (silent)
openclaw cron add --name "markdown-audit" --cron "0 3 * * *" --tz "Your/Timezone" \
  --session isolated --model gpt \
  --message "Audit workspace markdown files for consistency and outdated info. Fix minor issues. Flag major issues."

# Business meta-analysis (weekly AI Council, mid-tier)
openclaw cron add --name "business-meta-analysis" --cron "0 6 * * 1" --tz "Your/Timezone" \
  --session isolated --model sonnet --announce --channel telegram \
  --message "Weekly AI Council: analyse through Growth Strategist, Revenue Guardian, Skeptical Operator, Efficiency Analyst perspectives."

# Cost report (weekly)
openclaw cron add --name "cost-report" --cron "0 9 * * 1" --tz "Your/Timezone" \
  --session isolated --model gpt --announce --channel telegram \
  --message "Weekly cost report: per-provider spend, per-job costs, trend vs previous weeks."

# Auto-update (daily, silent unless update found)
openclaw cron add --name "auto-update" --cron "0 2 * * *" --tz "Your/Timezone" \
  --session isolated --model gpt --announce --channel telegram \
  --message "Check for OpenClaw updates. If available: install, restart gateway, verify health, report to Telegram."

# Off-hours heartbeat check (fills the 9pm-4am gap)
openclaw cron add --name "off-hours-check" --cron "30 0 * * *" --tz "Your/Timezone" \
  --session main --system-event "Off-hours check: review urgent messages, critical events, blocked tasks." --wake now
```

> **Note:** Cron jobs support `--channel telegram --to "CHAT_ID:topic:TOPIC_ID"` for targeting specific Telegram forum topics. Set this up after your topic group is running.

### 5.3 Pre-Meeting & Post-Meeting Automation

These features run as part of the heartbeat (every 30 minutes), not as separate cron jobs. Configure them in your `HEARTBEAT.md` workspace file.

#### Pre-Meeting Briefs

Every heartbeat, check BOTH calendars for meetings starting in the next 20-40 minutes:
- Google Calendar: `gog calendar events primary --account default --from <now> --to <+40min>`
- Outlook Calendar: `outlook-calendar events --days 0`

**Filter rules (all must be true):**
1. Meeting is 20+ minutes long
2. Has 2+ attendees
3. At least one attendee is NOT from your internal domain(s) (skip purely internal meetings)

**For qualifying meetings, gather:**
- Attendee context from Slack (`slack-reader search "<name>"`) and Teams (`teams-reader search "<name>"`)
- Previous meetings from Fathom (`fathom-meetings list`)
- Agenda from calendar invite, or draft one if none exists

**Deliver:** Post to Telegram Briefs topic + save via `POST /api/briefs` with `briefType: "Pre-Meeting Brief"`.

**Dedup:** Track briefed meetings in `memory/meetings-briefed.json`. Clean entries older than 24 hours.

#### Post-Meeting Reports

Every heartbeat, check both calendars for meetings that ended 30-90 minutes ago.

1. Check Fathom for transcript: `fathom-meetings list --after <today>`
2. If available: get summary, action items, and transcript via `fathom-meetings summary/actions/transcript <id>`
3. If not yet available: mark as "pending-transcript", retry on subsequent heartbeats (max 4 retries)
4. Save as document via `POST /api/documents` with `category: "Meeting Transcript"`
5. Save as brief via `POST /api/briefs` with `briefType: "Post-Meeting Report"`
6. Save transcript to workspace at `research/meetings/YYYY-MM-DD-<slug>.md`

**Deliver:** Post to Telegram Reports topic.

**Dedup:** Track in `memory/meetings-reported.json`. Clean entries older than 7 days.

### 5.4 Cost Estimate

| Component | Est. Cost/Month |
|---|---|
| Heartbeat (30min, 4am–6pm, cheap model) | $3–8 |
| Daily cron jobs (cheap model, 6 jobs) | $5–10 |
| Weekly cron jobs (mid-tier model, 3 jobs) | $5–12 |
| Off-hours + auto-update (cheap model) | $1–3 |
| **Total automation** | **$14–33** |

---

## Verification

- [ ] Heartbeat configured under `agents.defaults.heartbeat` with `every` duration string
- [ ] `openclaw cron list` shows all 11+ cron jobs
- [ ] Manually trigger morning brief: `openclaw cron trigger morning-brief`
- [ ] Morning brief includes data from both calendars, Slack, Teams, Reclaim
- [ ] Morning brief saved to Command Centre `/api/briefs` (verify via dashboard Briefs page)
- [ ] Check Telegram Briefs topic for delivery
- [ ] HEARTBEAT.md includes pre-meeting and post-meeting sections
- [ ] Gateway restarted after config changes
