"use client" // Interactive expandable row with tool invocation

import { useState } from "react"
import { ChevronDown, ChevronRight, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import McpToolSchemaView from "./McpToolSchemaView"
import type { McpTool } from "@/types/mcp.types"

interface McpToolRowProps {
  tool: McpTool
  onTryIt: (tool: McpTool) => void
}

export default function McpToolRow({ tool, onTryIt }: McpToolRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={expanded}
        aria-label={`${tool.name} tool details`}
      >
        {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{tool.name}</span>
            {tool.serverName && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tool.serverName}</span>
            )}
            {!tool.enabled && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">disabled</span>
            )}
          </div>
          {tool.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{tool.description}</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onTryIt(tool) }}
          className={cn("flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors",
            "bg-foreground text-background hover:opacity-90")}
          aria-label={`Try ${tool.name}`}
        >
          <Play size={12} aria-hidden="true" /> Try it
        </button>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          {tool.description && <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>}
          {tool.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-3">
              {tool.tags.map((tag) => <span key={tag} className="bg-muted px-1.5 py-0.5 rounded text-xs">{tag}</span>)}
            </div>
          )}
          <p className="text-xs font-medium mb-2">Input Schema</p>
          <McpToolSchemaView schema={tool.inputSchema} />
          {tool.lastSynced && <p className="text-xs text-muted-foreground mt-2">Last synced: {new Date(tool.lastSynced).toLocaleString()}</p>}
        </div>
      )}
    </div>
  )
}
