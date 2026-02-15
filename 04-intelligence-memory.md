# Phase 4: Intelligence & Memory

## Goal

Configure smart model routing and semantic memory search so your AI uses the right model for each task and can search across all workspace files.

---

### 4.1 Model Routing Strategy

The key principle: **use the cheapest model that gets the job done.**

| Task Type | Recommended Model | Why |
|---|---|---|
| Daily chat, heartbeats, cron jobs, overnight work | Cheapest capable model | High volume, routine work |
| Research synthesis, weekly reviews, complex reasoning | Mid-tier model | Needs nuance but not premium |
| Architecture, strategy, deep analysis | Premium model | Rare, high-stakes decisions |

Configure your models so the default handles 80% of interactions. Switch up only when the task demands it.

### 4.2 Memory Configuration

Add to `openclaw.json`:

```json
{
  "memory": {
    "search": true,
    "flushBeforeCompaction": true
  }
}
```

- `search: true` enables semantic search across all workspace markdown files
- `flushBeforeCompaction: true` prevents information loss when context is compacted

### 4.3 Document Memory Workflow in AGENTS.md

Add a memory architecture section to your AGENTS.md workspace file:

```
Daily notes (memory/YYYY-MM-DD.md) → Weekly synthesis (memory/weekly/) → Long-term memory (MEMORY.md)
```

This defines a clear flow: daily observations are captured, synthesised weekly, and important facts promoted to long-term memory.

### 4.4 Restart Gateway

```bash
systemctl --user restart openclaw-gateway
```

---

## Verification

- [ ] `memory.search` set to `true` in `openclaw.json`
- [ ] `memory.flushBeforeCompaction` set to `true`
- [ ] Memory architecture documented in AGENTS.md
- [ ] Gateway restarted
- [ ] Ask your AI to search memory for your business context — it should find files in your `business/` directory
