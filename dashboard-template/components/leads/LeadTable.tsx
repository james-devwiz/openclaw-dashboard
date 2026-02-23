"use client" // Requires checkbox state and click handlers for row selection and export

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

import LeadScoreBadge from "./LeadScoreBadge"
import { STATUS_COLORS } from "@/lib/lead-constants"

import type { Lead } from "@/types"

interface LeadTableProps {
  leads: Lead[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onExport: () => void
  onSelectLead: (lead: Lead) => void
}

export default function LeadTable({
  leads, selectedIds, onToggleSelect, onSelectAll, onExport, onSelectLead,
}: LeadTableProps) {
  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          <Button
            onClick={onExport}
            size="sm"
            aria-label="Export selected leads as CSV"
          >
            <Download size={12} /> Export CSV
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="p-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === leads.length && leads.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-border"
                  aria-label="Select all leads"
                />
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Company</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Contact</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Phone</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Score</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Source</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Next Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-border last:border-0 hover:bg-accent/20 cursor-pointer transition-colors"
                onClick={() => onSelectLead(lead)}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => onToggleSelect(lead.id)}
                    className="rounded border-border"
                    aria-label={`Select ${lead.companyName}`}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {lead.logoUrl ? (
                      <img src={lead.logoUrl} alt="" className="w-5 h-5 rounded object-contain bg-accent flex-shrink-0" />
                    ) : null}
                    <p className="font-medium text-foreground truncate max-w-[200px]">{lead.companyName}</p>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground truncate max-w-[150px]">{lead.contactName || "—"}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{lead.phone || "—"}</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[lead.status] }} />
                    {lead.status}
                  </span>
                </td>
                <td className="p-3"><LeadScoreBadge score={lead.score} /></td>
                <td className="p-3 text-muted-foreground hidden lg:table-cell text-xs">{lead.source}</td>
                <td className="p-3 text-muted-foreground hidden lg:table-cell text-xs truncate max-w-[140px]">{lead.nextAction || "—"}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No leads found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
