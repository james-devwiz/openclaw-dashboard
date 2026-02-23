// LinkedIn actions queue — list + create

import { NextRequest, NextResponse } from "next/server"
import { getActions, createAction } from "@/lib/db-linkedin"
import { createApproval } from "@/lib/db-approvals"
import { withActivitySource } from "@/lib/activity-source"
import { ACTION_TYPE_LABELS } from "@/lib/linkedin-constants"
import type { LinkedInActionType } from "@/types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || undefined
  const actions = getActions(status)
  return NextResponse.json({ actions })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { actionType, targetId, targetName, payload } = body as {
      actionType: LinkedInActionType
      targetId?: string
      targetName?: string
      payload: Record<string, unknown>
    }

    if (!actionType || !payload) {
      return NextResponse.json({ error: "actionType and payload are required" }, { status: 400 })
    }

    const label = ACTION_TYPE_LABELS[actionType] || actionType
    const name = targetName || "Unknown"

    const approval = createApproval({
      title: `LinkedIn: ${label} — ${name}`,
      category: "Permission Request",
      priority: "Medium",
      context: JSON.stringify({ actionType, targetId, targetName, payload }),
      options: "Approve|Reject",
      requestedBy: "Manual",
    })

    const action = createAction({
      actionType,
      targetId,
      targetName: name,
      payload: JSON.stringify(payload),
      approvalId: approval.id,
    })

    return NextResponse.json({ action, approval }, { status: 201 })
  })
}
