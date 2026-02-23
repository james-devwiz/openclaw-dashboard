"use client" // Requires useState for tab, modal, and slide-over state; composes lead sub-components

import { useState } from "react"
import { Plus, Loader2, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/layout/PageHeader"
import LeadStatCards from "@/components/leads/LeadStatCards"
import LeadPipeline from "@/components/leads/LeadPipeline"
import LeadTable from "@/components/leads/LeadTable"
import LeadTableFilters from "@/components/leads/LeadTableFilters"
import LeadCallList from "@/components/leads/LeadCallList"
import LeadChatTab from "@/components/leads/LeadChatTab"
import LeadSlideOver from "@/components/leads/LeadSlideOver"
import CreateLeadModal from "@/components/leads/CreateLeadModal"
import { useLeads } from "@/hooks/useLeads"
import { updateLeadApi } from "@/services/lead.service"
import { PIPELINE_LEGEND } from "@/lib/lead-constants"

import type { Lead, CallOutcome } from "@/types"

type LeadTab = "pipeline" | "table" | "calls" | "chat"

export default function LeadsPage() {
  const leads = useLeads()
  const [activeTab, setActiveTab] = useState<LeadTab>("pipeline")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const tabs: Array<{ id: LeadTab; label: string }> = [
    { id: "pipeline", label: "Pipeline" },
    { id: "table", label: "Table" },
    { id: "calls", label: "Call List" },
    { id: "chat", label: "Chat" },
  ]

  const handleSelectLead = (lead: Lead) => setSelectedLead(lead)

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    await leads.updateLead(id, updates)
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => prev ? { ...prev, ...updates } as Lead : null)
    }
  }

  const handleDeleteLead = async (id: string) => {
    await leads.removeLead(id)
    setSelectedLead(null)
  }

  const refreshSelected = (lead: Lead | undefined) => {
    if (lead) setSelectedLead(lead)
  }

  const handleMarkConnected = async (id: string) => {
    const updated = await updateLeadApi(id, { linkedinConnected: true })
    setSelectedLead(updated)
    leads.refetch()
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Leads"
        subtitle="B2B lead generation pipeline"
        actions={
          <Button onClick={() => setShowCreate(true)} aria-label="Create new lead">
            <Plus size={16} /> New Lead
          </Button>
        }
      />

      <LeadStatCards stats={leads.stats} />

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
        {activeTab === "pipeline" && (
          <span className="relative group cursor-default ml-1 -mb-px py-2.5">
            <HelpCircle size={14} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            <span className="pointer-events-none absolute left-0 top-full mt-1 z-50 hidden group-hover:block w-64 rounded-lg bg-foreground text-background text-[11px] leading-relaxed px-3 py-2.5 shadow-lg">
              <span className="font-semibold block mb-1.5">Pipeline Legend</span>
              {PIPELINE_LEGEND.map((item) => (
                <span key={item.emoji} className="block">
                  {item.emoji} {item.label}
                </span>
              ))}
            </span>
          </span>
        )}
      </div>

      {leads.loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeTab === "pipeline" && (
            <LeadPipeline leads={leads.leads} onMoveLead={leads.moveLead} onSelectLead={handleSelectLead} />
          )}
          {activeTab === "table" && (
            <>
              <LeadTableFilters filters={leads.filters} onFilterChange={leads.setFilter} />
              <LeadTable
                leads={leads.leads} selectedIds={leads.selectedIds}
                onToggleSelect={leads.toggleSelect} onSelectAll={leads.selectAll}
                onExport={leads.exportSelected} onSelectLead={handleSelectLead}
              />
            </>
          )}
          {activeTab === "calls" && <LeadCallList onSelectLead={handleSelectLead} />}
          {activeTab === "chat" && <LeadChatTab />}
        </>
      )}

      {selectedLead && (
        <LeadSlideOver
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
          onDelete={handleDeleteLead}
          onEnrich={async (id) => {
            const result = await leads.enrichLead(id)
            refreshSelected(result?.lead)
          }}
          enriching={leads.enriching === selectedLead.id}
          onGenerateOutreach={async (id) => {
            const result = await leads.generateOutreach(id)
            refreshSelected(result?.lead)
          }}
          generatingOutreach={leads.generatingOutreach === selectedLead.id}
          onGenerateResearch={async (id) => {
            const lead = await leads.generateResearchSummary(id)
            if (lead) setSelectedLead(lead)
          }}
          generatingResearch={leads.generatingResearch === selectedLead.id}
          onExecuteOutreach={async (id) => {
            const lead = await leads.executeOutreach(id)
            if (lead) setSelectedLead(lead)
          }}
          executingOutreach={leads.executingOutreach === selectedLead.id}
          onLogCallOutcome={async (id, outcome: CallOutcome, notes: string) => {
            const lead = await leads.logCallOutcome(id, outcome, notes)
            if (lead) setSelectedLead(lead)
          }}
          loggingCall={leads.loggingCall === selectedLead.id}
          onExecuteFollowUp={async (id) => {
            const lead = await leads.executeFollowUp(id)
            if (lead) setSelectedLead(lead)
          }}
          executingFollowUp={leads.executingFollowUp === selectedLead.id}
          onMarkConnected={handleMarkConnected}
        />
      )}

      {showCreate && (
        <CreateLeadModal onClose={() => setShowCreate(false)} onSubmit={leads.addLead} />
      )}
    </div>
  )
}
