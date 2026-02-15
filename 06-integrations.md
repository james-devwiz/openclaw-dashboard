# Phase 6: Integrations

## Goal

Connect additional services to give your AI more capabilities — calendar, email, meeting transcripts, task scheduling, and web search. This is the most human-involved phase: most integrations require you to create credentials, complete OAuth flows, or grant permissions in external dashboards.

> **How this phase works:** Unlike earlier phases where Claude Code can execute everything autonomously, integrations require a back-and-forth between you and Claude Code. You create credentials and complete auth flows in your browser; Claude Code handles the VPS configuration, token exchange, CLI tool creation, and testing.

---

### 6.1 Email — Gmail (via `himalaya` skill)

Gmail uses an app password for IMAP access through the bundled `himalaya` skill.

**You do:**

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requires 2FA enabled)
2. Create an app password — name it "OpenClaw" or "himalaya"
3. Copy the 16-character password (spaces don't matter)
4. Give the app password and your Gmail address to Claude Code

**Claude Code does:**

1. Stores the app password at `~/.openclaw/credentials/gmail-app-password`
2. Creates `~/.config/himalaya/config.toml` with the Gmail IMAP account:

```toml
[accounts.gmail]
email = "you@gmail.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.gmail.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@gmail.com"
backend.auth.type = "password"
backend.auth.cmd = "cat /root/.openclaw/credentials/gmail-app-password"
```

3. Tests with `himalaya envelope list -s 5`

**Result:** Your AI can read Gmail via `himalaya envelope list`, `himalaya message read <id>`, etc.

---

### 6.2 Email — Outlook/Microsoft 365 (via custom `outlook-mail` CLI)

Outlook requires OAuth2 because Microsoft doesn't offer app passwords for most accounts. The bundled `himalaya` binary is not compiled with OAuth2 support, so we use a custom Python CLI that speaks XOAUTH2 natively.

**You do:**

1. Go to [portal.azure.com](https://portal.azure.com) > **App registrations** > **New registration**
   - Name: "OpenClaw Email"
   - Supported account types: **Single tenant**
   - Redirect URI: **Web** → `http://localhost`
2. Note the **Application (client) ID** and **Directory (tenant) ID**
3. Go to **Certificates & secrets** > **New client secret** — copy the secret value
4. Go to **API permissions** > **Add a permission** > **APIs my organization uses** > search "Office 365 Exchange Online" > **Delegated** > `IMAP.AccessAsUser.All`
5. Click **Grant admin consent**
6. Give Claude Code: client ID, tenant ID, client secret, and your Outlook email address

**Claude Code does:**

1. Generates the OAuth2 authorization URL (tenant-specific endpoint — do NOT use `/common`)
2. You open the URL in your browser, sign in, and paste the redirect URL back
3. Exchanges the auth code for access + refresh tokens
4. Stores tokens and creates a token refresh script at `~/.openclaw/credentials/outlook-get-token.sh`
5. Creates `/usr/local/bin/outlook-mail` — a Python CLI using `imaplib` with XOAUTH2:

```
outlook-mail list [--folder FOLDER] [--limit N]   # list recent emails
outlook-mail read <message_id>                     # read a specific email
outlook-mail folders                               # list all folders
```

6. Tests with `outlook-mail list --limit 5`

> **Why not himalaya for Outlook?** The pre-built himalaya binary (v1.1.0) does not include the `+oauth2` cargo feature. Compiling from source fails due to Rust dependency conflicts. The Python wrapper is simpler and more reliable — it uses Python's built-in `imaplib` with the XOAUTH2 SASL mechanism.

> **Important:** The OAuth2 scope for IMAP is `https://outlook.office365.com/IMAP.AccessAsUser.All` — this is an Exchange Online scope, not a Microsoft Graph scope. Use the tenant-specific token endpoint, not `/common`.

**Result:** Your AI can read Outlook email via the `outlook-mail` CLI.

---

### 6.3 Google Calendar (via `gog` skill)

Calendar data powers morning briefs and scheduling awareness. `gog` is a Google Workspace CLI that handles Gmail, Calendar, Drive, and more.

**You do:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. Enable the **Google Calendar API** (APIs & Services > Library)
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
   - Application type: **Desktop app**
   - Name: "OpenClaw gog"
5. Download the JSON file (`client_secret_xxxxx.json`)
6. Give the JSON contents to Claude Code

**Claude Code does:**

1. Installs `gog` binary from [GitHub releases](https://github.com/steipete/gogcli/releases) (not Homebrew — can't run brew as root)
2. Uploads the client secret JSON and runs `gog auth credentials <path>`
3. Generates a keyring password and stores it at `~/.openclaw/credentials/gog-keyring-password`
4. Generates the OAuth URL (using `--remote --step 1`)

> **OAuth flow note:** The `gog` CLI's `--remote` two-step flow has state management issues over non-interactive SSH. If state mismatches occur, Claude Code will generate the auth URL manually using Python, exchange the code via `curl`, and import the token into gog's keyring using `gog auth tokens import`.

5. You open the auth URL, sign in with your Google account, and paste the redirect URL back
6. Claude Code exchanges the code for tokens and imports them into gog
7. Adds `GOG_KEYRING_PASSWORD` to the gateway systemd service environment
8. Adds `/home/linuxbrew/.linuxbrew/bin` to the service PATH (for himalaya)
9. Restarts the gateway
10. Tests with `gog calendar events primary --account default --from <today> --to <+7days>`

```bash
# Key environment variables for the gateway service:
Environment=GOG_KEYRING_PASSWORD=<your-keyring-password>
```

> **Critical:** Always use `--account default` when calling `gog` on a headless server. Without it, `gog` may fail with "no account found" errors because it can't interactively prompt for account selection.

**Result:** Your AI can read Google Calendar via `gog calendar events primary --account default --from <iso> --to <iso>`.

---

### 6.4 Outlook Calendar (via custom `outlook-calendar` CLI)

If you use Microsoft 365, you'll want Outlook calendar access too. This uses the Microsoft Graph API — a different scope from the IMAP email access.

**You do:**

1. Go to [portal.azure.com](https://portal.azure.com) > **App registrations** > your "OpenClaw Email" app
2. Go to **API permissions** > **Add a permission** > **Microsoft Graph** > **Delegated** > `Calendars.Read`
3. Click **Grant admin consent**
4. Tell Claude Code you've done it

**Claude Code does:**

1. Generates a new OAuth2 URL with the `https://graph.microsoft.com/Calendars.Read offline_access` scope
2. You open it, sign in, paste the redirect URL back
3. Exchanges the code for a separate set of Graph API tokens (stored separately from the IMAP tokens)
4. Creates a token refresh script at `~/.openclaw/credentials/outlook-graph-token.sh`
5. Creates `/usr/local/bin/outlook-calendar`:

```
outlook-calendar today                    # today's events
outlook-calendar tomorrow                 # tomorrow's events
outlook-calendar events [--days N]        # next N days (default 7)
```

6. Tests with `outlook-calendar events --days 7`

> **Why separate tokens?** The IMAP token has audience `https://outlook.office365.com` while the Graph token has audience `https://graph.microsoft.com`. Microsoft requires different tokens for different APIs — you can't use one token for both. Both use the same Azure AD app, but with different scopes.

**Result:** Your AI can read Outlook Calendar via the `outlook-calendar` CLI.

---

### 6.5 Reclaim.ai — Personal Task Scheduling

Reclaim.ai auto-schedules tasks around your calendar. Your AI can push tasks directly into your Reclaim queue.

**You do:**

1. Go to [app.reclaim.ai/settings/developer](https://app.reclaim.ai/settings/developer)
2. Create an API key
3. Give it to Claude Code

**Claude Code does:**

1. Stores the key at `~/.openclaw/credentials/reclaim-api-key`
2. Creates `/usr/local/bin/reclaim-tasks`:

```
reclaim-tasks list [--status STATUS] [--limit N]                           # list tasks
reclaim-tasks create --title TITLE [--duration MINS] [--due YYYY-MM-DD]    # create task
                     [--priority P1|P2|P3|P4] [--snooze-until YYYY-MM-DD]
reclaim-tasks complete <task_id>                                           # mark done
```

3. Tests with `reclaim-tasks list --limit 5`

**Result:** Your AI can list, create, and complete Reclaim tasks. Priority mapping: P1 (critical) > P2 (high) > P3 (medium) > P4 (low).

---

### 6.6 Fathom — Meeting Transcripts & Action Items

Fathom records meetings and generates summaries, transcripts, and action items. Your AI can pull these automatically.

**You do:**

1. Go to Fathom settings and create an API key
2. Give it to Claude Code

**Claude Code does:**

1. Stores the key at `~/.openclaw/credentials/fathom-api-key`
2. Creates `/usr/local/bin/fathom-meetings`:

```
fathom-meetings list [--limit N] [--after YYYY-MM-DD]    # list recent meetings
fathom-meetings summary <recording_id>                    # get meeting summary
fathom-meetings transcript <recording_id>                 # get full transcript
fathom-meetings actions <recording_id>                    # get action items
```

3. Tests with `fathom-meetings list`

> **API details:** Base URL is `https://api.fathom.ai/external/v1`. Authentication uses the `X-Api-Key` header (not `Authorization: Bearer`). Rate limit: 60 requests per minute.

**Result:** Your AI can access meeting summaries and transcripts via the `fathom-meetings` CLI.

---

### 6.7 Slack — Full Workspace Read Access (via `slack-reader` CLI)

OpenClaw already has a Slack bot for responding in channels. This adds a **user token** so your AI can read every channel you're in — not just the ones the bot is a member of.

**You do:**

1. Go to [api.slack.com/apps](https://api.slack.com/apps) > select your OpenClaw app
2. Go to **OAuth & Permissions** (may be under a horizontal nav or at `api.slack.com/apps/YOUR_APP_ID/oauth`)
3. Scroll to **User Token Scopes** (below Bot Token Scopes) and add:
   - `channels:history`, `channels:read`
   - `groups:history`, `groups:read`
   - `im:history`, `im:read`
   - `mpim:history`, `mpim:read`
   - `search:read`, `search:read.users`
4. Click **Reinstall to Workspace** and approve
5. Copy the new **User OAuth Token** (`xoxp-...`) and give it to Claude Code

**Claude Code does:**

1. Stores the token at `~/.openclaw/credentials/slack-user-token`
2. Creates `/usr/local/bin/slack-reader`:

```
slack-reader channels                              # list all channels you're in
slack-reader history <channel> [--limit N]          # recent messages in a channel
slack-reader search <query> [--limit N]             # search across all channels
slack-reader unread [--limit N]                     # channels with unread messages
slack-reader dms [--limit N]                        # recent direct messages
```

3. Tests with `slack-reader channels` and `slack-reader search "test" --limit 3`

> **Bot token vs User token:** The bot token (`xoxb-`) only sees channels the bot has been added to. The user token (`xoxp-`) sees everything *you* can see — all public channels, all private channels you're in, all DMs. Both tokens coexist; the bot token is for responding, the user token is for reading.

**Result:** Your AI can search and read across your entire Slack workspace.

---

### 6.8 Microsoft Teams — Read Access (via `teams-reader` CLI)

If you use Microsoft Teams, your AI can read team channels, chats, and meeting threads.

**You do:**

1. Go to [portal.azure.com](https://portal.azure.com) > **App registrations** > your "OpenClaw Email" app
2. Go to **API permissions** > **Add a permission** > **Microsoft Graph** > **Delegated**
3. Add:
   - `Chat.Read`
   - `ChannelMessage.Read.All`
   - `Team.ReadBasic.All`
   - `Channel.ReadBasic.All`
4. Click **Grant admin consent**
5. Tell Claude Code you've done it

**Claude Code does:**

1. Generates an OAuth2 URL with the Teams scopes
2. You sign in and paste the redirect URL back
3. Exchanges for tokens, creates a refresh script at `~/.openclaw/credentials/teams-get-token.sh`
4. Creates `/usr/local/bin/teams-reader`:

```
teams-reader teams                                     # list all teams
teams-reader channels <team_name_or_id>                # list channels in a team
teams-reader messages <team> <channel> [--limit N]     # read channel messages
teams-reader chats [--limit N]                         # list recent chats
teams-reader chat <chat_id> [--limit N]                # read chat messages
teams-reader search <query>                            # search messages
```

5. Tests with `teams-reader teams` and `teams-reader chats --limit 5`

> **Token reuse:** Teams uses the same Azure AD app as Outlook email and calendar, but with different Graph API scopes. Each set of scopes gets its own token and refresh script.

**Result:** Your AI can read all your Teams channels, chats, and meeting threads.

---

### 6.9 Web Search

If not already configured, set up Perplexity or Brave as your web search provider. This is typically already configured during initial OpenClaw setup. Verify with:

```bash
openclaw health
# Check for web search capability in the output
```

This enables:
- Research during overnight work
- Answering current-events questions
- Market research for your business

---

### 6.10 Restart Gateway

After all integrations are configured:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway
```

---

## Files Created

| File | Purpose |
|---|---|
| `~/.openclaw/credentials/gmail-app-password` | Gmail IMAP auth |
| `~/.openclaw/credentials/outlook-client-secret` | Azure AD client secret |
| `~/.openclaw/credentials/outlook-refresh-token` | Outlook IMAP OAuth2 refresh token |
| `~/.openclaw/credentials/outlook-get-token.sh` | IMAP token refresh script |
| `~/.openclaw/credentials/outlook-graph-refresh-token` | Graph API refresh token |
| `~/.openclaw/credentials/outlook-graph-token.sh` | Graph API token refresh script |
| `~/.openclaw/credentials/google-client-secret.json` | Google OAuth client credentials |
| `~/.openclaw/credentials/gog-keyring-password` | Keyring password for gog CLI |
| `~/.openclaw/credentials/reclaim-api-key` | Reclaim.ai API key |
| `~/.openclaw/credentials/fathom-api-key` | Fathom API key |
| `~/.config/himalaya/config.toml` | himalaya email config (Gmail only) |
| `/usr/local/bin/outlook-mail` | Outlook email CLI (Python + XOAUTH2) |
| `/usr/local/bin/outlook-calendar` | Outlook calendar CLI (Python + Graph API) |
| `/usr/local/bin/reclaim-tasks` | Reclaim.ai task CLI (Python + REST API) |
| `/usr/local/bin/fathom-meetings` | Fathom meetings CLI (Python + REST API) |
| `~/.openclaw/credentials/slack-user-token` | Slack user OAuth token (full read) |
| `/usr/local/bin/slack-reader` | Slack workspace reader CLI (Python + Web API) |
| `~/.openclaw/credentials/teams-refresh-token` | Teams Graph API refresh token |
| `~/.openclaw/credentials/teams-get-token.sh` | Teams token refresh script |
| `/usr/local/bin/teams-reader` | Teams reader CLI (Python + Graph API) |

## Verification

- [ ] Gmail readable: `himalaya envelope list -s 5`
- [ ] Outlook email readable: `outlook-mail list --limit 5`
- [ ] Google Calendar accessible: `gog calendar events primary --account default --from <today> --to <+7days>`
- [ ] Outlook Calendar accessible: `outlook-calendar today`
- [ ] Reclaim tasks listing: `reclaim-tasks list --limit 5`
- [ ] Fathom meetings listing: `fathom-meetings list`
- [ ] Slack full read: `slack-reader channels` (should show all channels)
- [ ] Slack search: `slack-reader search "test" --limit 3`
- [ ] Teams teams listing: `teams-reader teams`
- [ ] Teams chats: `teams-reader chats --limit 5`
- [ ] Web search working (ask your AI a current-events question)
- [ ] Gateway restarted after config changes
- [ ] Ask your AI: *"What's on my calendar today?"* — should pull from both calendars
- [ ] Ask your AI: *"Summarise my recent emails"* — should pull from both inboxes
- [ ] Ask your AI: *"What's happening in Slack?"* — should search across all channels
