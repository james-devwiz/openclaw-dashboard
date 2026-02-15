import { NextResponse } from "next/server"
import { getPendingCount } from "@/lib/db-approvals"

export async function GET() {
  const count = getPendingCount()
  return NextResponse.json({ count })
}
