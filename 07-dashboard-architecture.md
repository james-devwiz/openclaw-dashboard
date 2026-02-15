# Phase 7: Dashboard Architecture — Project Setup, Design System & Layout

## Goal

Set up the Next.js Command Centre dashboard project with a complete design system, global styling, reusable UI components, and the shell layout (sidebar + header). This phase creates the foundation that all subsequent dashboard phases build on. **The dashboard should look polished and modern, not like a developer prototype.**

---

### 7.1 Create the Next.js Project

```bash
npx create-next-app@latest dashboard --app --typescript --tailwind --src-dir=false --import-alias="@/*"
cd dashboard
```

Install all dependencies:

```bash
npm install \
  better-sqlite3 \
  class-variance-authority \
  clsx \
  framer-motion \
  lucide-react \
  react-markdown \
  tailwind-merge \
  ws \
  @radix-ui/react-avatar \
  @notionhq/client

npm install -D \
  @types/better-sqlite3 \
  @types/ws
```

**Expected `package.json` dependencies:**

```json
{
  "dependencies": {
    "@notionhq/client": "^2.3.0",
    "@radix-ui/react-avatar": "^1.1.11",
    "better-sqlite3": "^11.10.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.34.0",
    "lucide-react": "^0.563.0",
    "next": "^16.1.6",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-markdown": "^9.1.0",
    "tailwind-merge": "^3.0.2",
    "ws": "^8.19.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/ws": "^8.18.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 7.2 Configuration Files

**`next.config.ts`:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
```

> `serverExternalPackages` is required for `better-sqlite3` to work with Next.js (native module).

**`postcss.config.mjs`:**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**`tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

**`.env.local.template`:**

```env
# OpenClaw Command Centre Configuration

# OpenClaw Gateway (via SSH tunnel)
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-dashboard-token-here

# Notion API (for non-task integrations)
NOTION_API_KEY=your-notion-api-key

# VPS SSH (for remote health checks)
VPS_IP=76.13.181.45
VPS_USER=root
```

### 7.3 Folder Structure

```
dashboard/
├── app/           Pages + API routes (App Router)
├── components/
│   ├── ui/        Reusable primitives — Badge, IconBadge, ProgressRing, Card, Avatar, FilterBar, EmptyState
│   ├── layout/    Sidebar, PageHeader, LayoutProvider
│   └── <feature>/ Per-page components, added in later phases
├── hooks/         Custom React hooks
├── services/      API call wrappers — hooks never call fetch directly
├── lib/           Server utilities — db, gateway, workspace
└── types/         TypeScript interfaces, re-exported from index.ts
```

Create the directory structure:

```bash
mkdir -p components/{ui,layout} hooks services lib types
```

### 7.4 Global Stylesheet — `app/globals.css`

This is the complete design system. Copy it exactly.

> **CRITICAL — Tailwind CSS v4 cascade layer warning:** Never add unlayered CSS resets (e.g., `* { margin: 0; padding: 0; }`) in `globals.css`. Tailwind v4 puts all utilities inside `@layer utilities`. Unlayered styles always beat layered styles in the CSS cascade — so an unlayered `* { padding: 0 }` will override **every single** Tailwind padding class. Tailwind v4's preflight already includes `box-sizing: border-box` and margin/padding resets inside `@layer base`. If you need custom resets, place them inside `@layer base {}`.

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-status-todo: #6b7280;
  --color-status-progress: #3b82f6;
  --color-status-done: #10b981;
  --color-status-blocked: #ef4444;

  --color-priority-high: #ef4444;
  --color-priority-medium: #f59e0b;
  --color-priority-low: #6b7280;

  --color-health-good: #10b981;
  --color-health-warn: #f59e0b;
  --color-health-error: #ef4444;

  --color-claw-blue: #2563eb;
  --color-claw-purple: #7c3aed;
  --color-claw-green: #16a34a;
}

:root {
  --background: #f9fafb;
  --foreground: #111827;
  --card: #ffffff;
  --card-foreground: #111827;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --border: #e5e7eb;
  --accent: #f9fafb;
  --accent-foreground: #111827;
}

.dark {
  --background: #030712;
  --foreground: #f3f4f6;
  --card: #111827;
  --card-foreground: #f3f4f6;
  --muted: #1f2937;
  --muted-foreground: #9ca3af;
  --border: #1f2937;
  --accent: #1f2937;
  --accent-foreground: #f3f4f6;
}

body {
  font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--background);
  color: var(--foreground);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}

/* Drag and drop styles */
.kanban-card-dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}
```

### 7.5 Design Tokens Reference

When building components in later phases, use these tokens consistently:

| Token | Value | Usage |
|---|---|---|
| Card radius | `rounded-xl` | All cards |
| Icon radius | `rounded-lg` | Icon containers |
| Column radius | `rounded-3xl` | Pipeline/kanban columns |
| Pill radius | `rounded-full` | Filters, badges |
| Default shadow | `shadow-sm` | Cards at rest |
| Hover shadow | `hover:shadow-md` | Cards on hover |
| Card padding | `p-6` | Standard card content |
| Grid gap | `gap-6` to `gap-8` | Between sections |
| Stat value | `text-2xl font-bold` | Large metric numbers |
| Label text | `font-medium text-muted-foreground` | Card labels |
| Progress green | `<60%` | Emerald bar/text |
| Progress amber | `60-80%` | Amber bar/text |
| Progress red | `>80%` | Red bar/text |
| Left accent | `border-l-3` or `border-l-4` | Brief cards, approval cards |
| Glassmorphism | `bg-card/20 backdrop-blur-xl border border-border/50` | Columns, overlays |
| Transition | `transition-all duration-200` | Interactive elements |

### 7.6 Utility — `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Australia/Brisbane",
  });
}
```

> **Note:** Change `"Australia/Brisbane"` and `"en-AU"` to your own timezone and locale.

### 7.7 CVA Component — `components/ui/badge.tsx`

Badge with 7 variants:

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-claw-blue text-white",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "border-border text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        error: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### 7.8 CVA Component — `components/ui/IconBadge.tsx`

Icon badge with 8 color variants × 3 sizes:

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const iconBadgeVariants = cva(
  "rounded-lg flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-blue-500/20 text-blue-500",
        success: "bg-emerald-500/20 text-emerald-500",
        warning: "bg-amber-500/20 text-amber-500",
        error: "bg-red-500/20 text-red-500",
        info: "bg-blue-500/20 text-blue-500",
        purple: "bg-purple-500/20 text-purple-500",
        indigo: "bg-indigo-500/20 text-indigo-500",
        teal: "bg-teal-500/20 text-teal-500",
      },
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const ICON_SIZES = { sm: 14, md: 18, lg: 22 } as const

interface IconBadgeProps extends VariantProps<typeof iconBadgeVariants> {
  icon: LucideIcon
  className?: string
}

export default function IconBadge({
  icon: Icon,
  variant,
  size = "md",
  className,
}: IconBadgeProps) {
  return (
    <div className={cn(iconBadgeVariants({ variant, size }), className)}>
      <Icon size={ICON_SIZES[size || "md"]} />
    </div>
  )
}
```

### 7.9 CVA Component — `components/ui/ProgressRing.tsx`

SVG progress ring with 3 size variants × 3 color variants:

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const ringVariants = cva("", {
  variants: {
    size: {
      sm: "w-10 h-10",
      md: "w-14 h-14",
      lg: "w-20 h-20",
    },
    variant: {
      default: "text-claw-blue",
      success: "text-emerald-500",
      warning: "text-amber-500",
    },
  },
  defaultVariants: { size: "md", variant: "default" },
})

const SIZES = { sm: { r: 16, sw: 3 }, md: { r: 22, sw: 4 }, lg: { r: 32, sw: 5 } } as const

interface ProgressRingProps extends VariantProps<typeof ringVariants> {
  value: number
  className?: string
  showLabel?: boolean
}

export default function ProgressRing({ value, size = "md", variant, className, showLabel = true }: ProgressRingProps) {
  const { r, sw } = SIZES[size || "md"]
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const viewBox = (r + sw) * 2

  return (
    <div className={cn("relative inline-flex items-center justify-center", ringVariants({ size }), className)}>
      <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="w-full h-full -rotate-90">
        <circle
          cx={r + sw} cy={r + sw} r={r}
          fill="none" stroke="currentColor" strokeWidth={sw}
          className="opacity-15"
        />
        <circle
          cx={r + sw} cy={r + sw} r={r}
          fill="none" stroke="currentColor" strokeWidth={sw}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(ringVariants({ variant }))}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold text-foreground">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}
```

### 7.10 Other UI Components

**`components/ui/card.tsx`** — Card with subcomponents (CardHeader, CardTitle, CardDescription, CardContent, CardFooter). Uses `cn()` helper with `rounded-xl border border-border bg-card` as the base card class.

**`components/ui/avatar.tsx`** — Wrap `@radix-ui/react-avatar` with Avatar, AvatarImage, AvatarFallback components. Used in sidebar account section and chat messages.

**`components/ui/EmptyState.tsx`** — Centered icon + title + description + optional action button. Used when lists/grids are empty.

**`components/ui/FilterBar.tsx`** — Tab-style filter chips with selected state (`bg-foreground text-background` active, `bg-muted text-muted-foreground` inactive). Used on Goals, Tasks, Activity pages.

**`components/ui/PipelineColumn.tsx`** — Drag-and-drop enabled column for kanban/pipeline boards. Glassmorphism background in dark mode (`backdrop-blur-xl bg-white/5 border border-white/10`), subtle `bg-muted/30` in light mode. Column radius: `rounded-3xl`.

### 7.11 Dark Mode Hook — `hooks/useDarkMode.ts`

```typescript
"use client" // Requires useState, useEffect, useCallback and browser APIs (localStorage, matchMedia)

import { useState, useEffect, useCallback } from "react"

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("command-centre-dark-mode")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = stored ? stored === "true" : prefersDark
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle("dark", shouldBeDark)
  }, [])

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem("command-centre-dark-mode", String(next))
      document.documentElement.classList.toggle("dark", next)
      return next
    })
  }, [])

  return { isDark, toggle }
}
```

Reads from `localStorage` first, falls back to `prefers-color-scheme`, toggles `dark` class on `<html>`.

### 7.12 Layout Components

**`components/layout/LayoutProvider.tsx`** — React Context for dark mode + mobile menu state:

```typescript
"use client" // Requires React Context API and useDarkMode hook for theme state management

import React, { createContext, useContext, useState } from "react"
import { useDarkMode } from "@/hooks/useDarkMode"

interface LayoutContextType {
  isDark: boolean
  toggleDark: () => void
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider")
  return ctx
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { isDark, toggle } = useDarkMode()
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <LayoutContext.Provider
      value={{ isDark, toggleDark: toggle, isMobileMenuOpen, setMobileMenuOpen }}
    >
      {children}
    </LayoutContext.Provider>
  )
}
```

**`components/layout/Sidebar.tsx`** — Collapsible sidebar with:
- Nav items: Overview, Chat, Projects, Goals & Tasks, Content Centre, Approvals (with pending badge), Activity, Memory, Documents, Briefs & Reports, Architecture, Heartbeat
- Active state: `border-l-2 border-blue-500` with blue-tinted background
- `w-64` expanded / `w-16` collapsed
- Fixed on mobile (with overlay), sticky on desktop
- Approval badge counter (auto-polls every 30s via `useApprovals` hook)
- Dark mode toggle at bottom
- Collapse toggle button
- Icons from `lucide-react`

**`components/layout/PageHeader.tsx`** — Title + optional subtitle + actions slot:

```typescript
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        {description && <p className="text-muted-foreground mt-1 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </div>
  );
}
```

### 7.13 Root Layout — `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { LayoutProvider } from "@/components/layout/LayoutProvider";
import Sidebar from "@/components/layout/Sidebar";
import SearchDialog from "@/components/search/SearchDialog";

export const metadata: Metadata = {
  title: "Command Centre — Your AI",
  description: "OpenClaw Command Centre Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <LayoutProvider>
          <div className="flex min-h-screen w-full bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 p-6 pt-16 md:pt-6 overflow-auto">
              {children}
            </main>
          </div>
          <SearchDialog />
        </LayoutProvider>
      </body>
    </html>
  );
}
```

Key layout rules:
- `flex min-h-screen` — sidebar + main content side by side
- `main.flex-1.p-6` — content area fills remaining space with 24px padding
- `pt-16 md:pt-6` — extra top padding on mobile for hamburger button
- `SearchDialog` rendered outside the main flex container (modal overlay)

### 7.14 Coding Standards

Follow these standards for all dashboard code in subsequent phases:

**File & Component Rules:**
- **Max 200 lines per file.** If a page exceeds this, extract sub-components into `components/<feature>/`.
- **"use client" justification.** Every `"use client"` directive must include a comment explaining why: `"use client" // Requires useState for form state and useEffect for data fetching`
- **Import ordering.** Group imports with blank lines between: (1) React/Next, (2) third-party, (3) internal `@/` paths, (4) types.
- **File naming.** Services end in `.service.ts`. Hooks in `hooks/`. Types in `types/`. Components in PascalCase.

**Service Layer Pattern:**
- Hooks must **never** call `fetch()` directly. Create service files (e.g., `services/gateway.service.ts`) that wrap API calls, then hooks consume services.

```
services/gateway.service.ts  → getHealthApi(), getCronJobsApi(), triggerCronJobApi()
services/task.service.ts     → getTasksApi(), updateTaskStatusApi()
hooks/useGateway.ts          → uses gateway.service.ts
hooks/useTasks.ts            → uses task.service.ts
```

**Styling Rules:**
- **No inline styles** (`style={{}}`) — use Tailwind classes or CVA variants instead. The only exception is truly dynamic values like progress bar widths.
- Use **CVA** (class-variance-authority) for components with multiple visual variants.
- Use `cn()` (clsx + tailwind-merge) for conditional class application.

**Accessibility (mandatory):**
- `aria-label` on every interactive element (buttons, links, inputs)
- `aria-hidden="true"` on decorative icons (Lucide icons that don't convey meaning)
- `role="list"` / `role="listitem"` on custom list layouts
- `role="navigation"` with `aria-label` on nav elements
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on progress indicators
- `aria-current="page"` on active navigation links

---

## Verification

- [ ] `npm run dev` starts without errors
- [ ] Sidebar renders with all nav items (12 total), collapses/expands on desktop
- [ ] Dark mode toggle works (persists across refresh via localStorage)
- [ ] Mobile menu overlay appears on narrow viewport
- [ ] `globals.css` has all CSS custom properties for light and dark themes
- [ ] Badge, IconBadge, ProgressRing components render correctly with all variants
- [ ] Card, EmptyState, FilterBar components created
- [ ] PageHeader renders title, subtitle, and actions
- [ ] Root layout has `flex min-h-screen` with sidebar + main
- [ ] No unlayered CSS resets in `globals.css`
