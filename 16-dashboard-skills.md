# Phase 16: Skill Management — Enable/Disable Toggle & Install from Command Centre

## Goal

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

Add skill management controls to the Architecture > Skills tab, matching the Gateway Control UI functionality. Skills can be toggled enabled/disabled and missing skills can be installed directly — no need to leave the Command Centre or use the gateway dashboard at `:18789`.

**What you get:**
- Toggle switch to enable/disable any ready skill (writes to `openclaw.json` + restarts gateway)
- "Disabled" filter tab with yellow status badge
- "Install" button for missing skills (where platform-compatible installers exist)
- Install modal showing available installer options from SKILL.md frontmatter
- Support for `go` and `npm` install kinds (with `brew` marked unavailable on Linux VPS)

---

### 16.1 Type Extensions — `types/architecture.types.ts`

Add install spec interface and extend existing types:

```typescript
export type SkillStatus = "ready" | "missing" | "disabled"

export interface SkillInstallSpec {
  id: string
  kind: string
  label: string
  bins: string[]
  module?: string
  formula?: string
  url?: string
  package?: string
  available: boolean // false for brew on Linux, wrong OS, etc.
}

// Extend existing SkillInfo with:
disabled: boolean
install: SkillInstallSpec[]
```

Re-export `SkillInstallSpec` from `types/index.ts`.

### 16.2 Architecture API Update — `app/api/architecture/route.ts`

Update `parseSkillsJson()` to extract the `disabled` field from `openclaw skills list --json` output and map it to the new `"disabled"` status:

- If `s.disabled === true` → status is `"disabled"` (regardless of `eligible`)
- Otherwise, status is `"ready"` or `"missing"` based on `eligible`
- Add `disabled: boolean` and `install: []` (empty — install specs fetched on demand) to each skill

### 16.3 Config Write Helpers — `lib/gateway.ts`

Add two new exported functions:

```typescript
export async function writeConfig(config: OpenClawConfig): Promise<void> {
  // Write JSON to CONFIG_PATH with chmod 600
}

export async function restartGateway(): Promise<void> {
  // systemctl --user restart openclaw-gateway
}
```

Uses `writeFile` + `chmod` from `fs/promises`. Reuses the existing `CONFIG_PATH` constant and `runCommand()`.

### 16.4 Skill Toggle API — `app/api/architecture/skills/[name]/route.ts`

Add a `PATCH` handler to the existing skill detail route:

- Validate skill name with existing regex (`/^[a-z0-9_-]+$/i`)
- Read config via `readConfig()`
- Set `skills.entries.<name>.disabled` to `true` (disable) or `false` (enable)
- Write config via `writeConfig()`
- Restart gateway via `restartGateway()`
- Return `{ name, disabled }`

### 16.5 Install API — `app/api/architecture/skills/[name]/install/route.ts` (new file)

**GET** — Returns install specs for a skill:
- Read SKILL.md from managed (`/root/.openclaw/skills/`) or bundled (`/usr/lib/node_modules/openclaw/skills/`) directory
- Parse the `metadata:` JSON block from YAML frontmatter (note: trailing commas must be stripped — the frontmatter uses relaxed JSON)
- Extract `metadata.openclaw.install` array
- Mark `brew` kind specs as `available: false` (VPS is Linux)
- Return `{ specs: SkillInstallSpec[] }`

**POST** — Executes an install:
- Body: `{ installId: string }`
- Match `installId` to a spec from the parsed frontmatter
- Only allow known kinds (`go`, `npm`, `download`, `brew`, `uv`)
- Input validation: go module pattern (`/^[a-zA-Z0-9._/@-]+$/`), npm package pattern
- Execute: `go install <module>` or `npm install -g <package>`
- 120s timeout for installs
- Return `{ success, message }`

> **Frontmatter parsing note:** SKILL.md files use YAML with embedded JSON that has trailing commas. The parser strips trailing commas with a regex (`/,(\s*[}\]])/g`) before `JSON.parse()`. It finds the `metadata:` key, then extracts the JSON object starting from the first `{`.

### 16.6 Service Functions — `services/architecture.service.ts`

Add three functions:

```typescript
toggleSkill(name: string, enabled: boolean): Promise<void>           // PATCH
getSkillInstallSpecs(name: string): Promise<SkillInstallSpec[]>      // GET install
installSkill(name: string, installId: string): Promise<{message: string}>  // POST install
```

### 16.7 SkillRow Component — `components/architecture/SkillRow.tsx` (new file)

Extracted from SkillsTable to stay under 200-line limit. Contains:

- Toggle switch (green = ready/enabled, grey = disabled)
- Status badge with 3 colours (green/red/yellow for ready/missing/disabled)
- "Install" button for missing skills (blue, shows Download icon)
- Loading spinner during toggle operations
- Expanded detail row with description, missing reasons, docs link, homepage link

### 16.8 SkillInstallModal — `components/architecture/SkillInstallModal.tsx` (new file)

Modal triggered by the Install button:

- Fetches install specs on open via `getSkillInstallSpecs()`
- Lists each available installer with label and kind
- "Install" button per spec (disabled if `!available` or while installing)
- Loading state during install (120s timeout possible)
- Success (green) or error (red) result message
- "No automatic installer available for this platform" if no specs

### 16.9 SkillsTable Update — `components/architecture/SkillsTable.tsx`

- Add `onRefresh` callback prop (called after toggle/install to re-fetch data)
- Add "Disabled" filter tab with count
- Sort order: ready → disabled → missing
- Track `busySkill: string | null` for loading indicators
- Pass callbacks to `SkillRow` and `SkillInstallModal`
- Add "Actions" column header

### 16.10 Architecture Page Update — `app/architecture/page.tsx`

Pass `refetch` from `useArchitecture()` to `SkillsTable` as `onRefresh`:

```tsx
<SkillsTable skills={data.skills} onRefresh={refetch} />
```

---

## Files Summary

| File | Action | ~Lines |
|---|---|---|
| `types/architecture.types.ts` | Modify | +10 |
| `types/index.ts` | Modify | +1 |
| `app/api/architecture/route.ts` | Modify | +5 |
| `lib/gateway.ts` | Modify | +10 |
| `app/api/architecture/skills/[name]/route.ts` | Modify | +25 |
| `app/api/architecture/skills/[name]/install/route.ts` | New | ~110 |
| `services/architecture.service.ts` | Modify | +20 |
| `components/architecture/SkillRow.tsx` | New | ~105 |
| `components/architecture/SkillInstallModal.tsx` | New | ~95 |
| `components/architecture/SkillsTable.tsx` | Modify | ~30 changed |
| `app/architecture/page.tsx` | Modify | +1 |
| **Total** | **3 new, 8 modified** |

## Verification

- [ ] Architecture > Skills tab shows toggle switches on ready/disabled skills
- [ ] Toggle a ready skill to disabled → yellow "disabled" badge, gateway restarts
- [ ] Toggle it back to enabled → green "ready" badge, gateway restarts
- [ ] "Disabled" filter tab shows correct count
- [ ] Missing skills (not OS-blocked) show an "Install" button
- [ ] Click Install → modal shows available installers from SKILL.md frontmatter
- [ ] `brew`-kind specs show as "Unavailable" (Linux VPS)
- [ ] Install a `go`-kind skill (requires Go on VPS) → success message
- [ ] After install, refresh shows skill moved to "ready" status
- [ ] Invalid skill names return 400 error
- [ ] Install timeout (120s) handles gracefully
- [ ] `openclaw.json` updated correctly after toggle (check with `jq`)
- [ ] `npm run build` succeeds without errors
- [ ] Deploy to VPS and verify on live dashboard
