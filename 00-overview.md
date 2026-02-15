# The AI Orchestrators OpenClaw Deployment Plan

> A complete, step-by-step guide for deploying OpenClaw as a proactive AI chief of staff. Built for the AI Orchestrators community — people who make money with AI and want a personal assistant that works while they sleep.

> **How to use:** Work through each phase in order. For each phase, open Claude Code → type `/plan` → paste the entire phase file → review the plan → approve → let Claude Code execute. Verify the checklist at the end of each phase before moving on.

---

## What You're Building

First check this out: https://www.loom.com/share/4b295f2ea0694f1c97110cbda8196f10

By the end of this plan, you'll have:

- A **proactive AI assistant** that monitors your channels, tracks tasks, conducts research, and prepares daily briefs
- **Telegram as your mobile command centre** with organised topic threads
- **Heartbeat monitoring** that checks for urgent items every 30 minutes during active hours, with pre-meeting briefs for upcoming external meetings, post-meeting reports with Fathom transcript integration, and off-hours cron checks overnight
- **11+ automated cron jobs** including morning briefs (dual calendar, Slack, Teams, Reclaim), evening summaries (Fathom, task progress), weekly reviews, auto-updates, and overnight autonomous work — all with Command Centre API integration and Telegram topic routing
- A **custom Command Centre dashboard** with 15+ views (Overview, Chat, Goals & Tasks, Content Centre, Approvals, Activity, Memory, Briefs & Reports, Cron Status, Documents, Heartbeat, Architecture, Projects, MCP Management), Cmd+K global search, and real-time health monitoring
- **MCP server management** — add, test, and monitor Model Context Protocol servers that extend your AI with external tools (web scraping, databases, SaaS APIs)
- **Living files** — every piece of research saved as searchable markdown
- **Business meta-analysis** — a weekly "AI Council" that analyses your business from multiple expert perspectives

---

## Prerequisites

| Requirement | Status |
|---|---|
| VPS (Ubuntu, 4GB+ RAM) with SSH key access | Required |
| OpenClaw installed on VPS (`npm install -g openclaw@latest`) | Required |
| Claude Code running on your local machine | Required |
| SSH tunnel configured (local machine → VPS) | Required |
| OpenClaw gateway running as a systemd service | Required |
| At least one AI model configured (OpenAI, Anthropic, or similar) | Required |
| Slack workspace with OpenClaw bot connected | Recommended |
| Notion workspace with API key | Recommended |

### Already Done (from basic OpenClaw setup)

If you followed the standard OpenClaw installation, you should already have:

- VPS provisioned and hardened (SSH keys, firewall, fail2ban)
- OpenClaw installed globally via npm
- Gateway service running on localhost (not exposed to internet)
- SSH tunnel from your Mac/PC with auto-reconnection
- At least one AI model authenticated
- Basic channel connection (Slack or similar)

This plan builds on top of that foundation.

---

## How to Use This Plan

1. **Clone or download this repo** so the `deployment-plan/` folder is in your local project directory.
2. **Work through phases in order** (1–18). Each phase builds on the previous one.
3. **For each phase**, open Claude Code and point it at the file:
   ```
   /plan Implement the plan in deployment-plan/01-safety-net.md
   ```
   Claude Code will read the file, enter plan mode, and create a step-by-step implementation strategy. Review the plan, ask questions, then approve it. Claude Code executes everything — SSH commands, file creation, config changes — while you focus on decisions.
4. **Verify the checklist** at the end of each phase before moving on to the next.
5. Each phase is designed to be completed in a single session.

**Why this works:** Claude Code can read the phase files directly from your project — no need to copy-paste long documents. The `/plan` prefix puts it into plan mode so it analyses before acting. You review and approve before anything runs.

**Your role:** You're the decision-maker. Claude Code is the executor. You focus on "what" and "whether", Claude Code handles "how".

---

## Phase Summary

| Phase | File | What You Get |
|---|---|---|
| **1** | `01-safety-net.md` | Claude Code project set up, backups, version control |
| **2** | `02-context-engineering.md` | 8 workspace files giving your AI persistent identity and context |
| **3** | `03-telegram.md` | Telegram bot with topic groups for organised mobile-first comms |
| **4** | `04-intelligence-memory.md` | Model routing strategy and semantic memory search |
| **5** | `05-automation.md` | Heartbeat monitoring + 11 cron jobs for full automation |
| **6** | `06-integrations.md` | Google Workspace, email, meeting transcripts, web search |
| **7** | `07-dashboard-architecture.md` | Next.js project setup, design system, global styling, layout |
| **8** | `08-dashboard-template.md` | *Optional:* Pre-built template — edit one config file instead of building from scratch |
| **9** | `09-dashboard-data-layer.md` | SQLite schema, API routes, services, types, gateway client |
| **10** | `10-dashboard-overview-cron-brief.md` | Overview, Cron Status, and Briefs & Reports pages |
| **11** | `11-dashboard-chat.md` | Chat with SSE streaming and 7-topic routing |
| **12** | `12-dashboard-goals-tasks-content.md` | Goals grid, Kanban board, Content pipeline |
| **13** | `13-dashboard-approvals-memory-activity-search.md` | Approvals queue, Memory browser, Activity timeline, Cmd+K search |
| **14** | `14-dashboard-projects.md` | AI workspaces with scoped instructions, knowledge base, project-scoped chat |
| **15** | `15-dashboard-mcp.md` | MCP server management, tools catalogue, project bindings, observability |
| **16** | `16-dashboard-skills.md` | Skill enable/disable toggle, install from SKILL.md frontmatter |
| **17** | `17-dashboard-deployment.md` | VPS deployment, systemd service, SSH tunnel, security |
| **18** | `18-living-files-community.md` | Living Files philosophy, community notes, full verification checklist |

---

## Estimated Monthly Costs

| Component | Est. Cost |
|---|---|
| Cheap model (daily use, heartbeats, cron, overnight) | $25–40 |
| Mid-tier model (weekly reviews, business analysis) | $10–20 |
| Premium model (occasional deep work) | $5–15 |
| **Total API spend** | **$40–75/month** |

Adjust by: increasing heartbeat interval, reducing overnight work frequency, using cheaper models.

---

*Built by the AI Orchestrators community. Deploy it, customise it, make it yours.*
