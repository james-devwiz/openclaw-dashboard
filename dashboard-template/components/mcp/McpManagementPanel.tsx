"use client" // Sub-tab state management requires useState

import { useState } from "react"

import McpSubTabs from "./McpSubTabs"
import McpServerList from "./McpServerList"
import McpToolsCatalogue from "./McpToolsCatalogue"
import McpBindingsPanel from "./McpBindingsPanel"
import McpObservabilityPanel from "./McpObservabilityPanel"
import type { McpSubTab } from "./McpSubTabs"

export default function McpManagementPanel() {
  const [activeTab, setActiveTab] = useState<McpSubTab>("servers")

  return (
    <div>
      <McpSubTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "servers" && <McpServerList />}
      {activeTab === "tools" && <McpToolsCatalogue />}
      {activeTab === "bindings" && <McpBindingsPanel />}
      {activeTab === "observability" && <McpObservabilityPanel />}
    </div>
  )
}
