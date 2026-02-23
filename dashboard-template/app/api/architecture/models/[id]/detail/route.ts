import { NextResponse } from "next/server"

import { buildModelDetail } from "@/lib/model-detail"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params
  const modelId = decodeURIComponent(rawId)

  try {
    const detail = await buildModelDetail(modelId)
    return NextResponse.json(detail)
  } catch (err) {
    console.error("Model detail error:", err)
    return NextResponse.json(
      { error: "Failed to load model detail" },
      { status: 500 }
    )
  }
}
