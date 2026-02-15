import { NextRequest, NextResponse } from "next/server"
import { getFileHistory } from "@/lib/workspace-git"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const relativePath = Buffer.from(id, "base64url").toString("utf-8")

  try {
    const history = await getFileHistory(relativePath)
    return NextResponse.json({ history })
  } catch (err) {
    console.error("History fetch error:", err)
    return NextResponse.json({ history: [] })
  }
}
