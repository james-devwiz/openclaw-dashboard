// In-memory sliding window rate limiter — no external dependencies

const windows = new Map<string, number[]>()

const READ_LIMIT = 60  // requests per minute for GET
const WRITE_LIMIT = 30 // requests per minute for POST/PATCH/DELETE
const WINDOW_MS = 60_000

/** Check if request should be rate limited. Returns { limited, retryAfter } */
export function checkRateLimit(
  ip: string,
  method: string
): { limited: boolean; retryAfter: number } {
  const isWrite = method !== "GET" && method !== "HEAD" && method !== "OPTIONS"
  const limit = isWrite ? WRITE_LIMIT : READ_LIMIT
  const key = `${ip}:${isWrite ? "w" : "r"}`
  const now = Date.now()
  const cutoff = now - WINDOW_MS

  const timestamps = (windows.get(key) || []).filter((t) => t > cutoff)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000)
    windows.set(key, timestamps)
    return { limited: true, retryAfter: Math.max(1, retryAfter) }
  }

  timestamps.push(now)
  windows.set(key, timestamps)
  return { limited: false, retryAfter: 0 }
}

// Cleanup expired entries every 60s to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS
    for (const [key, timestamps] of windows) {
      const valid = timestamps.filter((t) => t > cutoff)
      if (valid.length === 0) windows.delete(key)
      else windows.set(key, valid)
    }
  }, WINDOW_MS)
}
