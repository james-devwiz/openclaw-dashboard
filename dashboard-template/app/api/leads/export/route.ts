import { NextRequest, NextResponse } from "next/server"
import { getLeads, getLeadById } from "@/lib/db-leads"
import { CSV_HEADERS } from "@/lib/lead-constants"
import type { Lead } from "@/types"

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function leadToRow(lead: Lead): string {
  return [
    lead.companyName, lead.contactName, lead.contactTitle, lead.email,
    lead.phone, lead.website, lead.linkedinUrl, lead.location, lead.status,
    String(lead.score), lead.source, lead.signalType, lead.notes,
    lead.createdAt.slice(0, 10),
  ].map(escapeCsv).join(",")
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get("ids")

  let leads: Lead[]

  if (ids) {
    const idList = ids.split(",")
    leads = idList.map(getLeadById).filter((l): l is Lead => l !== null)
  } else {
    leads = getLeads({
      status: searchParams.get("status") || undefined,
      business: searchParams.get("business") || undefined,
      limit: 500,
    })
  }

  const csv = [CSV_HEADERS.join(","), ...leads.map(leadToRow)].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
