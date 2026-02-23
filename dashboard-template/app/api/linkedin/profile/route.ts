// LinkedIn profile lookup via Unipile

import { NextRequest, NextResponse } from "next/server"
import { getUnipile, getAccountId, isUnipileConfigured } from "@/lib/unipile"

export async function GET(request: NextRequest) {
  if (!isUnipileConfigured()) {
    return NextResponse.json({ error: "Unipile not configured" }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const identifier = searchParams.get("id")

  if (!identifier) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 })
  }

  try {
    const client = getUnipile()
    const accountId = getAccountId()

    const profile = await client.users.getProfile({
      account_id: accountId,
      identifier,
    })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error("Profile lookup failed:", err)
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 })
  }
}
