"use client" // Requires useState for tab switching, useSearchParams for deep-link tab, useArchitecture hook

import { Suspense, useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { RefreshCw, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import AgentsTable from "@/components/architecture/AgentsTable"
import SkillsTable from "@/components/architecture/SkillsTable"
import ArchitectureFlow from "@/components/architecture/ArchitectureFlow"
import McpManagementPanel from "@/components/mcp/McpManagementPanel"
import ModelsPanel from "@/components/architecture/ModelsPanel"
import { useArchitecture } from "@/hooks/useArchitecture"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "agents", label: "Agents" },
  { id: "skills", label: "Skills" },
  { id: "models", label: "Models" },
  { id: "mcp", label: "MCP" },
  { id: "architecture", label: "Architecture" },
]

export default function ArchitecturePage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading...</p>}>
      <ArchitecturePageInner />
    </Suspense>
  )
}

function ArchitecturePageInner() {
  const { data, loading, refreshing, refetch } = useArchitecture()
  const searchParams = useSearchParams()
  const tabIds = TABS.map((t) => t.id)
  const initialTab = tabIds.includes(searchParams.get("tab") || "") ? searchParams.get("tab")! : "agents"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showDone, setShowDone] = useState(false)
  const prevRefreshing = useRef(false)

  useEffect(() => {
    if (prevRefreshing.current && !refreshing) {
      setShowDone(true)
      const t = setTimeout(() => setShowDone(false), 1500)
      return () => clearTimeout(t)
    }
    prevRefreshing.current = refreshing
  }, [refreshing])

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
            <div className="flex items-center gap-2">
              {showDone && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-in fade-in">
                  <Check size={14} /> Refreshed
                </span>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={refreshing}
                aria-label="Refresh architecture data"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
              </Button>
            </div>
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
      ) : activeTab === "models" ? (
        <ModelsPanel models={data.models} onRefresh={refetch} />
      ) : (
        <ArchitectureFlow data={data} />
      )}
    </div>
  )
}
