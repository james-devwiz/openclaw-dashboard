"use client" // Requires useState for tab switching and useArchitecture hook for data fetching

import { useState } from "react"
import { RefreshCw } from "lucide-react"

import PageHeader from "@/components/layout/PageHeader"
import AgentsTable from "@/components/architecture/AgentsTable"
import SkillsTable from "@/components/architecture/SkillsTable"
import ArchitectureFlow from "@/components/architecture/ArchitectureFlow"
import McpManagementPanel from "@/components/mcp/McpManagementPanel"
import { useArchitecture } from "@/hooks/useArchitecture"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "agents", label: "Agents" },
  { id: "skills", label: "Skills" },
  { id: "mcp", label: "MCP" },
  { id: "architecture", label: "Architecture" },
]

export default function ArchitecturePage() {
  const { data, loading, refetch } = useArchitecture()
  const [activeTab, setActiveTab] = useState("agents")

  return (
    <div>
      <PageHeader
        title="Architecture"
        subtitle="Agent hierarchy, skills inventory, org chart, and MCP servers"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-card text-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh architecture data"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        }
      />

      {activeTab === "mcp" ? (
        <McpManagementPanel />
      ) : loading ? (
        <p className="text-muted-foreground text-sm">Loading architecture data...</p>
      ) : !data ? (
        <p className="text-muted-foreground text-sm">Failed to load architecture data.</p>
      ) : activeTab === "agents" ? (
        <AgentsTable agents={data.agents} businesses={data.businesses} />
      ) : activeTab === "skills" ? (
        <SkillsTable skills={data.skills} onRefresh={refetch} />
      ) : (
        <ArchitectureFlow data={data} />
      )}
    </div>
  )
}
