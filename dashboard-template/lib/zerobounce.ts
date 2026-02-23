// ZeroBounce email validation — only called at final outreach stage

interface ZeroBounceResult {
  status: "valid" | "invalid" | "catch-all" | "unknown"
  subStatus: string
}

export async function validateEmail(email: string): Promise<ZeroBounceResult> {
  const apiKey = process.env.ZEROBOUNCE_API_KEY
  if (!apiKey) throw new Error("ZEROBOUNCE_API_KEY not configured")

  const url = new URL("https://api.zerobounce.net/v2/validate")
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("email", email)

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`ZeroBounce API error: ${res.status}`)
  }

  const data = await res.json() as { status: string; sub_status: string }

  // Normalise ZeroBounce status to our simplified set
  const statusMap: Record<string, ZeroBounceResult["status"]> = {
    valid: "valid",
    invalid: "invalid",
    "catch-all": "catch-all",
    unknown: "unknown",
    spamtrap: "invalid",
    abuse: "invalid",
    do_not_mail: "invalid",
  }

  return {
    status: statusMap[data.status] || "unknown",
    subStatus: data.sub_status || "",
  }
}
