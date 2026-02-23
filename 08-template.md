# Phase 8: Template — Quick Start (Optional)

## Goal

Skip building the dashboard from scratch. The `dashboard-template/` folder contains a complete, working Command Centre with all personal references centralised into a single config file. Edit one file, create `.env.local`, and you're ready to review and customise the remaining phases.

> **Building from scratch?** Skip this phase entirely and proceed to Phase 9. Phases 9–16 contain full build instructions.

---

### 8.1 Copy Template to Your Project

```bash
cp -r deployment-plan/dashboard-template/ dashboard/
cd dashboard
```

### 8.2 Edit `lib/site-config.ts`

This is the **only file** you need to personalise. Open it and update:

```typescript
export const SITE_CONFIG = {
  aiName: "Your AI Name",       // e.g., "Atlas", "Friday"
  aiNameShort: "AI",            // e.g., "Atlas", "Fri"
  aiInitials: "AI",             // e.g., "AT", "FR" (2 chars for avatars)
  dashboardTitle: "Command Centre",
  timezone: "Your/Timezone",    // e.g., "America/New_York", "Europe/London"
  locale: "en-US",              // e.g., "en-GB", "en-AU"
  utcOffsetHours: 0,            // e.g., -5 for EST, 10 for AEST
  businesses: [
    { id: "my-business", name: "My Business", description: "...", colour: "#3b82f6" },
    { id: "personal", name: "Personal", description: "Personal tasks", colour: "#10b981" },
  ],
  taskCategories: ["My Business", "Personal", "System"] as const,
  goalCategories: ["Personal", "System", "My Business"] as const,
  // ... update categoryVariants and goalFilterChips to match
}
```

### 8.3 Create `.env.local`

```bash
cp .env.local.template .env.local
```

Edit `.env.local` with your actual values:

```
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token-here
NOTION_API_KEY=your-notion-api-key
VPS_IP=your-vps-ip
VPS_USER=root
```

### 8.4 Install and Build

```bash
npm install
npm run build
```

If the build succeeds, the template is correctly configured.

### 8.5 Customise Architecture Agents

Open `lib/architecture-agents.ts` and replace the example agents with your own AI role definitions. Each agent appears on the Architecture page. Agents with a `systemPrompt` field get that context injected as a system message when @-mentioned in chat — this makes mentions functional, not just cosmetic.

### 8.6 Continue with Phases 9–18

The code for phases 9–16 is already in place. Work through each phase to:
- **Review** the files and understand what they do
- **Customise** anything specific to your setup
- **Verify** using the checklist at the end of each phase

Phase 17 covers VPS deployment. Phase 18 is the final verification checklist.

---

## Verification

- [ ] `dashboard/` directory exists with all source files
- [ ] `lib/site-config.ts` edited with your AI name, timezone, locale, and businesses
- [ ] `.env.local` created with gateway token and VPS IP
- [ ] `npm run build` succeeds without errors
- [ ] No references to placeholder values ("Your AI", "Business 1") remain in site-config
- [ ] `lib/architecture-agents.ts` customised with your agent definitions (add `systemPrompt` to key agents)
