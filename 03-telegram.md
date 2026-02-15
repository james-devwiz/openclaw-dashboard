# Phase 3: Telegram as Primary Channel

## Goal

Set up Telegram with topic groups for organised, mobile-first communication. This becomes your primary interface with your AI — faster and more structured than Slack for personal use.

---

### Why Telegram

- **Forum Topics** let you organise conversations (Morning Brief, Tasks, Research, etc.)
- **Mobile-first** — interact from anywhere
- **Long-lived sessions** — 30-day topic threads maintain context
- **Push notifications** — get alerted when something matters

### 3.1 Create the Bot

1. Open Telegram, message **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g., "My AI Assistant")
4. Choose a username (must end in `bot`)
5. Save the bot token
6. Send `/setprivacy` → select your bot → **DISABLE** (so it can read group messages)

### 3.2 Create the Topic Group

1. Create a new Telegram group (e.g., "AI HQ")
2. Go to group settings → **Topics** → Enable
3. Add your bot as **admin** (grant all permissions)
4. Create these topics:
   - **General** — general chitchat
   - **Briefs** — all briefs (morning briefs, pre-meeting briefs, etc.)
   - **Reports** — automated reports from cron jobs and scheduled tasks
   - **Research** — saved articles, web search results, overnight findings
   - **Tasks & Goals** — to-do tracking, goal setting, and progress updates
   - **Self-Improvement** — AI's own development notes and optimisation suggestions
   - **Memory** — memory system dumps, fact logs, and context updates
   - Add more topics for your specific projects

### 3.3 Get Your User ID

Message **@userinfobot** on Telegram. It will reply with your user ID.

### 3.4 Configure OpenClaw

Add the Telegram channel config and enable the plugin in `openclaw.json`:

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_BOT_TOKEN",
      "dmPolicy": "pairing",
      "allowFrom": ["YOUR_USER_ID"],
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["YOUR_USER_ID"],
      "groups": {
        "*": {
          "requireMention": true
        }
      },
      "replyToMode": "first",
      "streamMode": "partial"
    }
  },
  "plugins": {
    "entries": {
      "telegram": {
        "enabled": true
      }
    }
  },
  "session": {
    "reset": {
      "mode": "daily",
      "atHour": 4
    }
  }
}
```

> **Important config notes:**
> - Telegram config goes under `channels.telegram` (not `plugins.telegram`)
> - The token key is `botToken` (not `token`)
> - User allowlists use `allowFrom` and `groupAllowFrom` (flat arrays of user ID strings)
> - The plugin must also be enabled under `plugins.entries.telegram.enabled: true`

> **Security note:** Always set `groupAllowFrom` to your Telegram user ID. Without it, any group member can invoke bot commands — including skill commands.

### 3.5 Restart and Test

```bash
systemctl --user restart openclaw-gateway
openclaw health
```

DM the bot and send a message in each topic. All should respond.

---

## Verification

- [ ] Telegram bot created via @BotFather with privacy disabled
- [ ] Topic group created with at least 7 topics
- [ ] Bot added as admin to the group
- [ ] `channels.telegram` configured in `openclaw.json` with correct `botToken` and `allowFrom`
- [ ] `plugins.entries.telegram.enabled` set to `true`
- [ ] Gateway restarted
- [ ] `openclaw health` shows Telegram connected
- [ ] Bot responds to DMs
- [ ] Bot responds in each topic group
