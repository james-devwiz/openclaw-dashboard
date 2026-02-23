// Authenticated fetch wrapper — adds bearer token to all API requests

const API_TOKEN = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_DASHBOARD_API_TOKEN || ""
  : ""

/** Fetch with auth header. Drop-in replacement for fetch() on API routes. */
export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (API_TOKEN) {
    headers.set("Authorization", `Bearer ${API_TOKEN}`)
  }
  return fetch(url, { ...init, headers })
}
