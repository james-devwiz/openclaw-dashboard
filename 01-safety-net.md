# Phase 1: Set Up Claude Code & Safety Net

## Goal

Get Claude Code ready as your implementation partner, then snapshot everything before making changes. This phase ensures you can always roll back if something goes wrong.

---

### 1.1 Open Claude Code in Your IDE

1. Open your IDE (Cursor, VS Code, Anti-Gravity, Windsurf — whatever you use)
2. If you haven't already, create a local project for OpenClaw:
   ```bash
   mkdir -p ~/Documents/dev/tools/OpenClaw
   cd ~/Documents/dev/tools/OpenClaw
   git init
   ```
3. This project will store your workspace files, deploy scripts, dashboard source, and serve as your setup log
4. Make sure Claude Code is running and can SSH to your VPS:
   ```bash
   ssh your-vps "echo 'Connected' && openclaw --version"
   ```

### 1.2 Use Claude Code's Plan Mode

This is the key workflow. Instead of manually implementing each phase, you direct Claude Code and it executes for you.

1. Open Claude Code
2. Type `/plan`
3. Paste the entire contents of the phase file you're working on
4. Claude Code will analyse the plan, ask clarifying questions, and create a step-by-step implementation strategy
5. Review the plan, approve it, and let Claude Code execute

**This is your workflow for every phase going forward:**
```
/plan → paste the phase → review → approve → Claude Code implements
```

Claude Code will:
- Create workspace files locally, show you for review, then deploy to VPS
- Run SSH commands on your VPS to configure OpenClaw
- Build and deploy the dashboard
- Handle all the technical details while you focus on decisions

### 1.3 Backup Current State

Before making any changes, snapshot everything:

```bash
# SSH into your VPS
ssh your-vps

# Create a timestamped backup
cd ~
tar czf /tmp/openclaw-backup-$(date +%Y%m%d-%H%M%S).tar.gz .openclaw/

# Check current version
openclaw --version

# Update to latest
npm install -g openclaw@latest
systemctl --user restart openclaw-gateway
openclaw --version
```

### 1.4 Version Control Your Workspace

```bash
cd ~/.openclaw/workspace/
git init
git add -A
git commit -m "Initial workspace snapshot"
```

From this point forward, every change to your workspace is tracked. You can always roll back.

### 1.5 Verify Everything Works

```bash
openclaw health
openclaw status
```

All channels should show connected. If anything is broken, fix it before proceeding.

---

## Verification

- [ ] Claude Code can SSH to your VPS and run `openclaw --version`
- [ ] Backup created at `/tmp/openclaw-backup-*.tar.gz` on VPS
- [ ] Git initialised in `~/.openclaw/workspace/` with initial commit
- [ ] `openclaw health` returns healthy
- [ ] `openclaw status` shows all channels connected
- [ ] OpenClaw updated to latest version
