import { NextRequest, NextResponse } from "next/server"
import { getFileDiff } from "@/lib/workspace-git"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const relativePath = Buffer.from(id, "base64url").toString("utf-8")
  const from = request.nextUrl.searchParams.get("from") || ""
  const to = request.nextUrl.searchParams.get("to") || "HEAD"

  if (!from) {
    return NextResponse.json({ error: "from hash required" }, { status: 400 })
  }

  try {
    const diff = await getFileDiff(relativePath, from, to)
    return NextResponse.json({ diff })
  } catch (err) {
    console.error("Diff fetch error:", err)
    return NextResponse.json({ diff: "" })
  }
}
