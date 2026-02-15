# Phase 17: Dashboard Deployment — VPS, systemd, SSH Tunnel & Security

## Goal

Deploy the Command Centre dashboard to the VPS as a production service. The dashboard **must** run on the VPS — it reads config files, runs CLI commands, and connects to the gateway via local HTTP. A local deployment has no access to any of this data.

---

### 17.1 Build Locally

```bash
cd dashboard
npm run build
```

Verify the build succeeds without errors.

### 17.2 Copy to VPS

Copy the dashboard source to the VPS (exclude `node_modules` and `.next` — these will be rebuilt on the VPS):

```bash
rsync -avz --exclude='node_modules' --exclude='.next' \
  dashboard/ root@your-vps:/root/openclaw-dashboard/
```

Or with SCP:

```bash
scp -r dashboard/ root@your-vps:/root/openclaw-dashboard/
# Then clean up on VPS:
ssh your-vps "cd /root/openclaw-dashboard && rm -rf node_modules .next"
```

### 17.3 Create `.env.local` on VPS

```bash
ssh your-vps "cat > /root/openclaw-dashboard/.env.local << 'EOF'
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token-here
OPENCLAW_WORKSPACE_PATH=/root/.openclaw/workspace
NOTION_API_KEY=your-notion-api-key
EOF"
```

> Get the gateway token from `openclaw.json` → `gateway.auth.token`

### 17.4 Install Dependencies & Build on VPS

```bash
ssh your-vps "cd /root/openclaw-dashboard && npm install && npm run build"
```

> `better-sqlite3` compiles native bindings during `npm install`. This must happen on the VPS (Linux), not your Mac. That's why we exclude `node_modules` and rebuild.

### 17.5 Create systemd Service

Create `/etc/systemd/system/openclaw-dashboard.service`:

```ini
[Unit]
Description=OpenClaw Command Centre Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/openclaw-dashboard
ExecStart=/usr/bin/npm run start -- -p 18790 -H 127.0.0.1
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable openclaw-dashboard
systemctl start openclaw-dashboard
systemctl status openclaw-dashboard
```

The dashboard binds to `127.0.0.1:18790` — not exposed to the internet, only accessible via SSH tunnel.

### 17.6 SSH Tunnel Configuration

Add port forwarding to your SSH config or tunnel script. You need two ports:

```
LocalForward 18789 127.0.0.1:18789   # OpenClaw gateway
LocalForward 18790 127.0.0.1:18790   # Command Centre dashboard
```

If using a LaunchAgent for auto-reconnecting tunnel on macOS, add the second `LocalForward` line and restart:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.ssh-tunnel.plist
launchctl load ~/Library/LaunchAgents/com.user.ssh-tunnel.plist
```

Access the dashboard at: `http://localhost:18790`

### 17.7 Architecture Summary

```
Browser → localhost:18790 (SSH tunnel) → VPS:18790 (Next.js)
  ├── Health/Config/Cron API routes → read openclaw.json + run CLI commands
  ├── Task/Goal/Content/Approval routes → SQLite (mission-control.db)
  ├── Memory routes → read workspace files from disk
  ├── Chat route → POST to gateway HTTP API (localhost:18789)
  ├── Project routes → SQLite + workspace files (context injection)
  ├── MCP routes → SQLite + mcporter CLI → MCP servers
  └── Search route → query across all data sources
```

### 17.8 Security Hardening

- [ ] **Rotate gateway token** — don't use the default. Generate a new one:
  ```bash
  NEW_TOKEN=$(openssl rand -hex 24)
  echo "New token: $NEW_TOKEN"
  ```
  Update in: `openclaw.json` (`gateway.auth.token`), dashboard `.env.local` (`OPENCLAW_GATEWAY_TOKEN`), and your local shell alias if you have one.

- [ ] **Restrict elevated permissions** to your user IDs only (Telegram `allowFrom` + `groupAllowFrom`, Slack equivalent)

- [ ] **Dashboard not exposed to internet** — verify `127.0.0.1` binding, not `0.0.0.0`

### 17.9 Config Backup Cron

Set up nightly backup of config and credentials on VPS:

```bash
# Create backup script
cat > /root/backup-openclaw-config.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/root/.openclaw/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d)
tar czf $BACKUP_DIR/config-$DATE.tar.gz -C /root/.openclaw openclaw.json credentials/
find $BACKUP_DIR -name 'config-*.tar.gz' -mtime +7 -delete
EOF
chmod +x /root/backup-openclaw-config.sh

# Add to crontab
(crontab -l 2>/dev/null; echo '0 3 * * * /root/backup-openclaw-config.sh') | sort -u | crontab -
```

### 17.10 Updating the Dashboard

When you make changes to the dashboard locally:

```bash
# From your local machine
rsync -avz --exclude='node_modules' --exclude='.next' \
  dashboard/ root@your-vps:/root/openclaw-dashboard/

ssh your-vps "cd /root/openclaw-dashboard && npm install && npm run build"
ssh your-vps "systemctl restart openclaw-dashboard"
```

---

## Verification

- [ ] Dashboard accessible at `http://localhost:18790` (via SSH tunnel)
- [ ] `systemctl status openclaw-dashboard` shows active/running
- [ ] Dashboard bound to `127.0.0.1:18790` (not `0.0.0.0`)
- [ ] SSH tunnel forwards both ports 18789 and 18790
- [ ] Gateway token rotated from default
- [ ] `.env.local` on VPS has correct `OPENCLAW_GATEWAY_TOKEN`
- [ ] Config backup cron running nightly (check crontab)
- [ ] All dashboard pages load and display data (Overview, Chat, Projects, Goals & Tasks, Content, Approvals, Activity, Memory, Documents, Briefs, Architecture, Heartbeat)
- [ ] Chat streaming works through the tunnel
