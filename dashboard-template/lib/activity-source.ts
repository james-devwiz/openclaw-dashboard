// Request-scoped activity source via AsyncLocalStorage
// API routes wrap handlers with withActivitySource() so logActivity()
// automatically knows where the action originated (dashboard, cron, openclaw, etc.)

import { AsyncLocalStorage } from "async_hooks"
import type { NextRequest } from "next/server"

export type ActivitySource = "dashboard" | "cron" | "openclaw" | "api"

const storage = new AsyncLocalStorage<ActivitySource>()

/** Read the activity source for the current request context */
export function getActivitySource(): ActivitySource {
  return storage.getStore() || "dashboard"
}

/** Wrap a route handler to set activity source from X-Activity-Source header */
export function withActivitySource<T>(
  request: NextRequest,
  handler: () => Promise<T>
): Promise<T> {
  const raw = request.headers.get("x-activity-source")
  const source: ActivitySource =
    raw === "cron" || raw === "openclaw" || raw === "api" ? raw : "dashboard"
  return storage.run(source, handler)
}
