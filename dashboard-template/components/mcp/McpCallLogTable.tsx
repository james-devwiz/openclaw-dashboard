"use client" // Paginated log table with status badges

import { cn } from "@/lib/utils"
import type { McpCallLog } from "@/types/mcp.types"

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-red-100 text-red-700",
  timeout: "bg-amber-100 text-amber-700",
}

interface McpCallLogTableProps {
  logs: McpCallLog[]
  total: number
  onLoadMore: () => void
}

export default function McpCallLogTable({ logs, total, onLoadMore }: McpCallLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-muted-foreground text-sm">No call logs yet.</p>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">Time</th>
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">Server</th>
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">Tool</th>
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">Status</th>
              <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">Latency</th>
              <th className="pb-2 text-xs font-medium text-muted-foreground">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/50">
                <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4 text-xs">{log.serverName || log.serverId}</td>
                <td className="py-2 pr-4 text-xs font-medium">{log.toolName}</td>
                <td className="py-2 pr-4">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", STATUS_STYLES[log.status] || "")}>
                    {log.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-xs text-muted-foreground">{log.latencyMs}ms</td>
                <td className="py-2 text-xs text-red-600 truncate max-w-xs">{log.errorMessage || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length < total && (
        <button onClick={onLoadMore} className="mt-4 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
          Load more ({total - logs.length} remaining)
        </button>
      )}
    </div>
  )
}
