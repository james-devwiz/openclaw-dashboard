"use client" // Requires useState for expand/collapse of agent hierarchy sections

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AgentWithLiveData, BusinessDefinition } from "@/types/index"

const TYPE_STYLES: Record<string, string> = {
  main: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  contextual: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  sub: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
}

interface AgentsTableProps {
  agents: AgentWithLiveData[]
  businesses: BusinessDefinition[]
}

function AgentCard({ agent, businesses }: { agent: AgentWithLiveData; businesses: BusinessDefinition[] }) {
  const businessMap = Object.fromEntries(businesses.map((b) => [b.id, b]))
  const isMain = agent.type === "main"

  return (
    <div className={cn("rounded-xl border bg-card p-5", isMain ? "border-blue-200 dark:border-blue-800" : "border-border")}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{agent.name}</span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_STYLES[agent.type])}>
              {agent.type}
            </span>
            {!isMain && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                planned
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
        </div>
        {agent.live && (
          <code className="shrink-0 px-2 py-1 rounded bg-muted text-xs font-mono text-foreground">
            {agent.live.model}
          </code>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {/* Businesses */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Domains:</span>
          {agent.businesses.map((bid) => {
            const biz = businessMap[bid]
            return biz ? (
              <span key={bid} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: biz.colour }} />
                {biz.name}
              </span>
            ) : null
          })}
        </div>

        {/* Skills count */}
        {isMain && (
          <span className="text-xs text-muted-foreground">
            {agent.readySkillCount}/{agent.totalSkillCount} skills ready
          </span>
        )}
        {!isMain && agent.skills.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Skills: {agent.skills.join(", ")}
          </span>
        )}

        {/* Heartbeat */}
        {isMain && agent.live?.heartbeat.enabled && (
          <span className="text-xs text-muted-foreground">
            Heartbeat: {agent.live.heartbeat.interval}m
          </span>
        )}

        {/* Fallbacks */}
        {isMain && agent.live?.fallbacks?.length ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Fallbacks:</span>
            {agent.live.fallbacks.map((f) => (
              <code key={f} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                {f}
              </code>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function AgentsTable({ agents, businesses }: AgentsTableProps) {
  const [showHierarchy, setShowHierarchy] = useState(false)

  const mainAgent = agents.find((a) => a.type === "main")
  const contextualAgents = agents.filter((a) => a.type === "contextual")
  const subAgents = agents.filter((a) => a.type === "sub")
  const hasSubAgents = contextualAgents.length > 0 || subAgents.length > 0

  return (
    <div className="space-y-4">
      {mainAgent && <AgentCard agent={mainAgent} businesses={businesses} />}

      {hasSubAgents && (
        <div>
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            aria-label={showHierarchy ? "Hide agent hierarchy" : "Show agent hierarchy"}
          >
            <ChevronDown className={cn("size-4 transition-transform", showHierarchy && "rotate-180")} />
            {showHierarchy ? "Hide" : "Show"} agent hierarchy ({contextualAgents.length + subAgents.length} planned)
          </button>

          {showHierarchy && (
            <div className="space-y-3 pl-4 border-l-2 border-border">
              {contextualAgents.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Contextual Agents
                  </span>
                  {contextualAgents.map((a) => (
                    <AgentCard key={a.id} agent={a} businesses={businesses} />
                  ))}
                </div>
              )}
              {subAgents.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sub-Agents
                  </span>
                  {subAgents.map((a) => (
                    <AgentCard key={a.id} agent={a} businesses={businesses} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
