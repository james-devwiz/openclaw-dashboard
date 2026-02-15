/**
 * Site Configuration — THE ONE FILE TO EDIT
 *
 * Customise your Command Centre by editing the values below.
 * This is the only file you need to change (plus .env.local for secrets).
 *
 * After editing, run `npm run build` to verify everything compiles.
 */

export const SITE_CONFIG = {
  // --- AI Identity ---
  aiName: "Your AI",        // Full name shown in UI (e.g., "Jimmy AI", "Atlas")
  aiNameShort: "AI",        // Short name for tabs/labels (e.g., "Jimmy", "Atlas")
  aiInitials: "AI",         // 2-char initials for avatars (e.g., "JA", "AT")

  // --- Dashboard ---
  dashboardTitle: "Command Centre",

  // --- Locale & Timezone ---
  timezone: "UTC",           // IANA timezone (e.g., "Australia/Brisbane", "America/New_York")
  locale: "en-US",           // BCP 47 locale for date/number formatting (e.g., "en-AU", "en-GB")
  // UTC offset in hours for server-side date calculations.
  // This is a simplified approach — it doesn't handle DST transitions.
  // For most use cases (daily task promotion, date grouping) this is sufficient.
  utcOffsetHours: 0,         // e.g., 10 for AEST, -5 for EST, 0 for UTC

  // --- Businesses (shown on Architecture page) ---
  businesses: [
    { id: "business-1", name: "Business 1", description: "Your primary business", colour: "#3b82f6" },
    { id: "personal", name: "Personal", description: "Personal tasks and projects", colour: "#10b981" },
  ],

  // --- Categories ---
  // These define the category dropdowns for tasks and goals.
  // TaskCategory and GoalCategory types are derived from these arrays.
  taskCategories: ["Business 1", "Personal", "System"] as const,
  goalCategories: ["Personal", "System", "Business 1"] as const,

  // Badge variant mapping for goal category pills (keys must match goalCategories)
  // Variants: "default" | "secondary" | "success" | "warning" | "error" | "outline" | "destructive"
  categoryVariants: {
    Personal: "secondary",
    System: "default",
    "Business 1": "default",
  } as Record<string, string>,

  // Filter chips shown on the Goals page
  goalFilterChips: [
    { id: "all", label: "All" },
    { id: "Personal", label: "Personal" },
    { id: "System", label: "System" },
    { id: "Business 1", label: "Business 1" },
  ],
} as const
