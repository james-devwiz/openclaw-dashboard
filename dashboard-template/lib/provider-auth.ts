// Read AI provider credentials from OpenClaw auth profiles

import { readFileSync } from "fs"

const AUTH_PROFILES_PATH =
  process.env.AUTH_PROFILES_PATH ||
  "/root/.openclaw/agents/main/agent/auth-profiles.json"

export type ProviderKey = "anthropic" | "openai-codex" | "google-gemini-cli"

interface AuthProfile {
  token?: string
  access?: string
}

let cached: Record<string, AuthProfile> | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

function loadProfiles(): Record<string, AuthProfile> {
  const now = Date.now()
  if (cached && now - cacheTime < CACHE_TTL) return cached

  try {
    const raw = readFileSync(AUTH_PROFILES_PATH, "utf-8")
    const file = JSON.parse(raw)
    cached = file.profiles ?? file
    cacheTime = now
    return cached!
  } catch (error) {
    console.error("Failed to load auth profiles:", error)
    return {}
  }
}

export function getProviderToken(provider: ProviderKey): string | null {
  const profiles = loadProfiles()
  // Try exact :default key, then bare provider, then first matching prefix
  const profile =
    profiles[`${provider}:default`] ??
    profiles[provider] ??
    Object.entries(profiles).find(([k]) => k.startsWith(`${provider}:`))?.[1]
  if (!profile) return null
  return profile.token || profile.access || null
}
