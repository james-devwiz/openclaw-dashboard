# Phase 11: Dashboard Chat — SSE Streaming with Topic Routing

## Goal

Build a chat interface with SSE streaming that connects to the OpenClaw gateway's HTTP chat completions API. Messages are routed to 7 different topics, each with its own gateway session and system prompt. This gives you a web-based chat interface alongside Telegram/Slack.

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

---

### 11.1 Enable HTTP Chat API on VPS

The chat completions endpoint is **disabled by default** in OpenClaw. You must enable it.

Add to `openclaw.json` on the VPS:

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

Then restart:

```bash
systemctl --user restart openclaw-gateway
```

Verify it works:

```bash
curl -X POST http://localhost:18789/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw:main","messages":[{"role":"user","content":"hi"}]}'
```

### 11.2 Chat API Route — `app/api/chat/route.ts`

HTTP streaming bridge architecture:

```
Browser → localhost:18790 (SSH tunnel) → VPS:18790 (Next.js API route)
  → POST /v1/chat/completions on localhost:18789 (gateway)
  → SSE stream relayed back to browser as text/event-stream
```

The API route:
- Reads `OPENCLAW_GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN` from `.env.local`
- Receives messages + topic from the browser
- Forwards to `POST /v1/chat/completions` on the gateway with:
  - `Authorization: Bearer <token>` header
  - `x-openclaw-session-key: command-centre-<topic>` header (isolates sessions per topic)
  - `stream: true` in the request body
- Relays the SSE stream back to the browser as `text/event-stream`

**Important:** The chat route does NOT read `openclaw.json` directly — it uses `.env.local` credentials only.

### 11.3 Chat Topics — 7 Channels

Each topic gets its own gateway session via the `x-openclaw-session-key` header:

| Topic | Session Key | System Prompt Context | Quick Actions |
|---|---|---|---|
| General | `command-centre-general` | General assistant | "What's my schedule?", "Quick status" |
| Briefs | `command-centre-briefs` | Brief generation (uses `:::brief`/`:::brief-update` markers) | "Morning brief", "Pre-meeting brief" |
| Reports | `command-centre-reports` | Report analysis (uses `:::brief`/`:::brief-update` markers) | "Cost report", "Weekly summary" |
| Research | `command-centre-research` | Research assistant | "Research [topic]", "Summarise article" |
| Tasks | `command-centre-tasks` | Task management | "List open tasks", "Create task" |
| Self-Improvement | `command-centre-self-improvement` | AI self-analysis | "Review my performance", "Suggest improvements" |
| Memory | `command-centre-memory` | Memory & context | "What do you know about X?", "Search memory" |

### 11.4 Brief/Report Content Separation

Briefs and reports topics use a document-generation flow that separates conversational chat from full document content:

**Marker Format:**
```
Your conversational confirmation here.

:::brief
type: Morning Brief
title: Morning Brief - February 16, 2026
date: 2026-02-16

# Full brief content...
:::end
```

For updating an existing brief:
```
Your conversational confirmation here.

:::brief-update
id: <briefId>

# Full updated brief content...
:::end
```

**Flow:**
1. System prompts in `lib/chat-prompts.ts` instruct the AI to use `:::brief`/`:::end` markers
2. `stripMetaBlocks()` strips markers client-side during streaming (handles partial blocks too)
3. `postProcessChatResponse()` in `lib/chat-post-process.ts` extracts brief content via `parseBriefBlock()` or `parseBriefUpdateBlock()`, saves to DB, returns `{ events, chatContent }`
4. `chat-stream.ts` passes `chatContent` (stripped) to `onComplete` for saving to `chat_messages`
5. `useChat.ts` injects the most recent `briefId` from message metadata into the system prompt so the AI can use `:::brief-update`
6. No markers = no auto-save (conversational messages don't create briefs)

**Key files:**
- `lib/chat-prompts.ts` — Parsers: `parseBriefBlock()`, `parseBriefUpdateBlock()`, `stripMetaBlocks()`
- `lib/chat-post-process.ts` — Side effects: brief creation/update, task creation
- `lib/db-briefs.ts` — `createBrief()`, `updateBrief()`
- `lib/chat-stream.ts` — `postProcess` returns `{ events, chatContent }`

### 11.5 Chat Hook — `hooks/useChat.ts`

State management for the chat interface:
- Messages keyed per-topic (switching topics preserves message history)
- SSE stream parsing with progressive content updates
- `isStreaming` flag on the current message being received
- `sendMessage(topic, content)` function
- `clearMessages(topic)` function

### 11.6 Auto-Resize Textarea — `hooks/useAutoResizeTextarea.ts`

Auto-expanding textarea that grows with content:
- Min height (1 line) to max height (~6 lines)
- Resets on submit
- Handles window resize

### 11.7 Chat Page — `app/chat/page.tsx`

**Layout:** Full-height page with topic selector at top, message area in middle, input at bottom.

**Components to create in `components/chat/`:**

**Topic Selector:**
- Horizontal row of topic buttons
- Active topic highlighted with animated pill indicator (use `framer-motion` `layoutId` for smooth transitions)
- Each topic shows its icon and label

**Message Area:**
- Messages with avatar, name, timestamp
- User messages right-aligned (or distinct styling)
- AI messages left-aligned with streaming cursor
- `framer-motion` for message entry animations
- Auto-scroll to bottom on new messages

**ThinkingIndicator — `components/chat/ThinkingIndicator.tsx`:**
- Animated staggered steps showing AI processing states
- Status icons change as each step completes
- Smooth fade-in/out with `framer-motion`

**Input Area:**
- Glassmorphic input container (`bg-card/20 backdrop-blur-xl border border-border/50`)
- Auto-resizing textarea (via `useAutoResizeTextarea` hook)
- Send button with loading state during streaming
- Submit on Enter (Shift+Enter for newline)
- Quick action buttons shown in empty state (per-topic)

### 11.8 Unread Notification System

Per-topic read cursors track which messages have been seen.

**Database:** `chat_read_cursors` table (topic TEXT PK, lastReadAt TEXT). Seed migration on first init sets all existing topics to `now` so historical messages don't show as unread.

**Backend — `lib/db-chat.ts`:**
- `getUnreadCounts()` — LEFT JOIN cursors on chat_messages where role='assistant' and createdAt > lastReadAt, grouped by topic
- `markTopicRead(topic)` — UPSERT sets cursor to now

**API — `app/api/chat/unread/route.ts`:**
- GET → `{ counts: Record<string, number>, total: number }`
- POST `{ topic }` → marks topic read, returns `{ ok: true }`

**Service — `services/chat.service.ts`:**
- `getUnreadCountsApi()` + `markTopicReadApi(topic)`

**Hook — `hooks/useChatUnread.ts`:**
- Follows `useApprovals` pattern: polls every 30 seconds
- Optimistic `markRead(topic)` clears count immediately, calls API, re-fetches on failure
- Returns `{ counts, total, markRead, refetch }`

**Sidebar badge — `components/layout/Sidebar.tsx`:**
- Badge type changed from `boolean` to `BadgeKey` union (`"approvals" | "chat"`)
- `useChatUnread` hook provides `total` for the Chat nav item

**Topic badges — `components/chat/ChatTopicSelector.tsx`:**
- New `unreadCounts` prop, small red badge on each inactive topic tab when count > 0

**Chat page wiring — `app/chat/page.tsx`:**
- Calls `useChatUnread()`, passes `unreadCounts` to `ChatTopicSelector`
- `useEffect` on `activeTopic` → `markRead(activeTopic)` (fires on mount + topic switch)
- `useEffect` on `isStreaming` → when streaming ends, `markRead(activeTopic)` (new messages while viewing)

---

## Verification

- [ ] HTTP chat API enabled on VPS (`chatCompletions.enabled: true` in openclaw.json)
- [ ] Gateway restarted after config change
- [ ] `curl` test to `/v1/chat/completions` returns a response
- [ ] Chat page loads with 7 topic tabs
- [ ] Switching topics preserves message history per topic
- [ ] Messages stream progressively (SSE streaming visible character by character)
- [ ] ThinkingIndicator shows while AI is processing
- [ ] Textarea auto-resizes as you type
- [ ] Enter sends message, Shift+Enter creates newline
- [ ] Quick action buttons appear for each topic's empty state
- [ ] Each topic uses a separate gateway session (conversations are isolated)
- [ ] Fresh deploy shows no phantom unread counts (seed migration sets cursors to now)
- [ ] Sidebar shows red badge on Chat icon when unread messages exist
- [ ] Per-topic badges appear on inactive topic tabs
- [ ] Clicking a topic clears its badge immediately (optimistic mark-read)
- [ ] Staying on a topic during AI streaming does not produce unread count for that topic
- [ ] Leaving the chat page, new messages arrive within 30s as badge updates
