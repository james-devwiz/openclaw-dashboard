import type { TaskStatus, TaskCategory, TaskComplexity, TaskAssignee } from "@/types/index"

export const ALL_STATUSES: TaskStatus[] = [
  "Backlog", "To Be Scheduled", "To Do This Week", "In Progress", "Requires More Info", "Blocked", "Needs Review", "Completed",
]

export const ALL_CATEGORIES: TaskCategory[] = [
  "Business A", "Business B", "Business C", "Personal",
]

export const COLUMN_COLORS: Record<TaskStatus, { dot: string; bg: string }> = {
  "Backlog": { dot: "bg-gray-400", bg: "bg-gray-400/10" },
  "To Be Scheduled": { dot: "bg-indigo-400", bg: "bg-indigo-400/10" },
  "To Do This Week": { dot: "bg-gray-500", bg: "bg-gray-500/10" },
  "In Progress": { dot: "bg-blue-500", bg: "bg-blue-500/10" },
  "Requires More Info": { dot: "bg-amber-500", bg: "bg-amber-500/10" },
  "Blocked": { dot: "bg-red-500", bg: "bg-red-500/10" },
  "Needs Review": { dot: "bg-purple-500", bg: "bg-purple-500/10" },
  "Completed": { dot: "bg-emerald-500", bg: "bg-emerald-500/10" },
}

export const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-500",
  Medium: "text-amber-500",
  Low: "text-muted-foreground",
}

export const ALL_COMPLEXITIES: TaskComplexity[] = ["Simple", "Moderate", "Complex"]
export const COMPLEXITY_COLORS: Record<string, string> = {
  Simple: "text-green-500", Moderate: "text-blue-500", Complex: "text-purple-500",
}

export const ALL_ASSIGNEES: TaskAssignee[] = ["AI Assistant", "User"]
export const ASSIGNEE_COLORS: Record<TaskAssignee, { text: string; bg: string; border: string }> = {
  "AI Assistant": { text: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "User": { text: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
}

/** Statuses that auto-assign to the AI Assistant */
export const AI_ASSIGNEE_STATUSES: TaskStatus[] = ["To Be Scheduled", "To Do This Week", "In Progress"]
/** Statuses that auto-assign to the User */
export const USER_ASSIGNEE_STATUSES: TaskStatus[] = ["Needs Review"]

export function cronToHuman(schedule: string): string {
  if (!schedule) return "unknown"
  // Handle "every Xh" / "every Xm" from interval-based jobs
  if (schedule.startsWith("every ")) return schedule.charAt(0).toUpperCase() + schedule.slice(1)
  // Strip timezone suffix e.g. "(Australia/Brisbane)"
  const expr = schedule.replace(/\s*\(.*\)$/, "").trim()
  const parts = expr.split(" ")
  if (parts.length !== 5) return schedule

  const [min, hour, , , dow] = parts

  if (min.startsWith("*/")) return `Every ${min.slice(2)} min`
  if (hour.startsWith("*/")) return `Every ${hour.slice(2)}h`

  const h = parseInt(hour)
  const m = parseInt(min)
  if (isNaN(h)) return schedule

  // Times are already in the job's timezone (AEST)
  const suffix = h >= 12 ? "pm" : "am"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const time = m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (dow === "1-5") return `Weekdays ${time}`
  if (dow === "6,0" || dow === "0,6") return `Weekends ${time}`
  if (dow !== "*") {
    const dayNames = dow.split(",").map((d) => days[parseInt(d)] || d).join(", ")
    return `${dayNames} ${time}`
  }
  return `Daily ${time}`
}
