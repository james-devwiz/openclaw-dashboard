import { NextRequest, NextResponse } from "next/server"

import { validateSource } from "@/lib/source-validation"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { platform, url, comments } = body

  if (!platform || !url) {
    return NextResponse.json({ error: "platform and url are required" }, { status: 400 })
  }

  const result = await validateSource({ platform, url, comments })
  return NextResponse.json(result)
}
