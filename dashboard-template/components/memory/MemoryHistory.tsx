"use client" // Requires useState, useEffect for loading history and selecting commits

import { useState, useEffect } from "react"
import { History, ChevronDown } from "lucide-react"

import MemoryDiffView from "./MemoryDiffView"
import { getMemoryHistoryApi, getMemoryDiffApi } from "@/services/memory.service"
import { cn, formatRelativeTime } from "@/lib/utils"

import type { GitLogEntry } from "@/services/memory.service"

interface MemoryHistoryProps {
  encodedPath: string
}

export default function MemoryHistory({ encodedPath }: MemoryHistoryProps) {
  const [history, setHistory] = useState<GitLogEntry[]>([])
  const [expanded, setExpanded] = useState(false)
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [diff, setDiff] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!expanded) return
    setLoading(true)
    getMemoryHistoryApi(encodedPath).then(setHistory).finally(() => setLoading(false))
  }, [expanded, encodedPath])

  async function showDiff(hash: string, index: number) {
    if (selectedHash === hash) { setSelectedHash(null); return }
    setSelectedHash(hash)
    const parentHash = history[index + 1]?.hash || `${hash}~1`
    const diffText = await getMemoryDiffApi(encodedPath, parentHash, hash)
    setDiff(diffText)
  }

  return (
    <div className="mt-6 pt-4 border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase hover:text-foreground transition-colors"
      >
        <History size={12} />
        Version History
        <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No version history available</p>
          ) : (
            history.map((entry, i) => (
              <div key={entry.hash}>
                <button
                  onClick={() => showDiff(entry.hash, i)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-accent transition-colors",
                    selectedHash === entry.hash && "bg-accent"
                  )}
                >
                  <span className="font-mono text-muted-foreground">{entry.hash.slice(0, 7)}</span>
                  <span className="ml-2 text-foreground">{entry.message}</span>
                  <span className="ml-2 text-muted-foreground">{formatRelativeTime(entry.date)}</span>
                </button>
                {selectedHash === entry.hash && <MemoryDiffView diff={diff} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
