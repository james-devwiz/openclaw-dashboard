# Phase 20 — Security Hardening

## Overview

Comprehensive security audit and hardening of the OpenClaw Command Centre dashboard and VPS deployment. Focuses on practical, high-value measures appropriate for a single-user SSH-tunnel-only architecture.

## Security Audit Summary

### Already Strong
- SSH key-only auth (Ed25519), password auth disabled
- UFW firewall enabled, port 18789 explicitly denied, fail2ban active
- Services bind to `127.0.0.1` only (not `0.0.0.0`)
- Parameterized SQL queries throughout (`better-sqlite3`)
- Shell injection protection — `execFile()` in `workspace-git.ts`, `mcporter.ts`
- Path traversal protection — `safePath()` in `workspace-write.ts`
- Secrets in `.env.local`, properly `.gitignore`d
- `openclaw.json` written with `0o600` permissions
- Command input validation (regex on job names, skill names, git hashes)
- Activity logging audit trail on all mutations

### Gaps Addressed
1. **API route authentication** — Bearer token auth via middleware
2. **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, etc.
3. **Rate limiting** — In-memory sliding window on API routes
4. **`exec()` in gateway.ts** — Replaced with `execFile()`
5. **Error message leaks** — Sanitized gateway error responses
6. **File permissions** — `mcporter.json` and SQLite DB set to `0o600`
7. **SQLite backups** — Added to daily VPS backup script
8. **No middleware.ts** — Created with security headers, auth, rate limiting

### Intentionally Excluded
| From enterprise guides | Why not applicable |
|---|---|
| JWT/RS256, RBAC | Single user, SSH-tunnel only |
| Session management | No user sessions |
| HTTPS/TLS | SSH tunnel provides encryption |
| CORS lockdown | Localhost-only, same-origin |
| Redis rate limiting | In-memory Map sufficient |
| Docker hardening | No Docker |
| CI/CD security | Manual rsync deploy |
| SQLCipher | SSH-only access; OS-level encryption if needed |

## Implementation

### Middleware (`middleware.ts`)
- Security headers on ALL responses
- Bearer token auth on `/api/*` routes (exempt: `/api/health`)
- In-memory rate limiting: 60 req/min GET, 30 req/min POST/PATCH/DELETE
- Token read from `DASHBOARD_API_TOKEN` env var

### Authenticated Fetch (`lib/api-client.ts`)
- Shared `apiFetch()` wrapper includes `Authorization: Bearer <token>` header
- All 16 service files updated to use wrapper
- Token exposed to client via `NEXT_PUBLIC_DASHBOARD_API_TOKEN`

### Rate Limiter (`lib/rate-limit.ts`)
- Sliding window algorithm using `Map<string, number[]>`
- Auto-cleanup of expired entries every 60 seconds
- Separate limits for read (GET) and write (POST/PATCH/DELETE) operations

### Gateway Hardening (`lib/gateway.ts`)
- All `exec()` calls replaced with `execFile()` argument arrays
- `/proc/loadavg` read with `readFile()` instead of spawning `cat`

### Error Sanitization (`lib/chat-stream.ts`)
- Gateway error responses no longer leak status codes or raw body text
- Detailed errors logged server-side via `console.error()`

### File Permissions
- `mcporter.json` — `chmod 0o600` after every write
- `mission-control.db` — `chmod 0o600` on database initialization

### VPS Backup Script
- `mission-control.db` added to daily backup using SQLite `.backup` command
- Safe for WAL mode (unlike raw file copy)

## Verification Checklist
- [ ] `curl localhost:18790/api/tasks` returns 401
- [ ] `curl -H "Authorization: Bearer <token>" localhost:18790/api/tasks` returns data
- [ ] Response headers include CSP, X-Frame-Options, X-Content-Type-Options
- [ ] 60+ rapid requests return 429
- [ ] Gateway restart still works with `execFile()`
- [ ] `stat -c '%a' /root/.openclaw/mission-control.db` returns 600
- [ ] Dashboard UI works normally with auth token in service layer
