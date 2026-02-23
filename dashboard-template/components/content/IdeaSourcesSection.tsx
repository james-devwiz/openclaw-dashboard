"use client" // Requires useState for modal toggle, useCallback for event handlers

import { useState, useCallback } from "react"

import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreateIdeaSourceModal from "./CreateIdeaSourceModal"
import IdeaSourceRow from "./IdeaSourceRow"
import MobileSourceCard from "./MobileSourceCard"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/Toast"
import { useIdeaSources } from "@/hooks/useIdeaSources"
import { useCron } from "@/hooks/useCron"

export default function IdeaSourcesSection() {
  const { sources, loading, toggleSource, deleteSource, fetchSources } = useIdeaSources()
  const { triggerJob } = useCron()
  const { toast } = useToast()
  const [showSourceModal, setShowSourceModal] = useState(false)

  const handleTrigger = useCallback(async (cronJobName: string): Promise<boolean> => {
    const ok = await triggerJob(cronJobName)
    toast(ok ? "Scan triggered — results will appear shortly" : "Failed to trigger scan", ok ? "success" : "error")
    return ok
  }, [triggerJob, toast])

  const handleToggle = useCallback(async (id: string): Promise<boolean> => {
    const src = sources.find((s) => s.id === id)
    const ok = await toggleSource(id)
    const action = src?.enabled ? "paused" : "enabled"
    toast(ok ? `Source ${action}` : `Failed to ${src?.enabled ? "pause" : "enable"} source`, ok ? "success" : "error")
    return ok
  }, [toggleSource, sources, toast])

  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteSource(id)
    toast(ok ? "Source deleted" : "Failed to delete source", ok ? "success" : "error")
    return ok
  }, [deleteSource, toast])

  const handleCreated = useCallback(() => {
    setShowSourceModal(false)
    fetchSources()
    toast("Idea source created", "success")
  }, [fetchSources, toast])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Idea Sources</h3>
          <Badge variant="secondary" className="text-[10px]">{sources.length}</Badge>
        </div>
        <Button
          onClick={() => setShowSourceModal(true)}
          size="sm"
          aria-label="Add idea source"
        >
          <Plus size={12} aria-hidden="true" />
          Idea Source
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : sources.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Platform</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">URL</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Frequency</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Last Run</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Ideas</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-2 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <IdeaSourceRow key={s.id} source={s} onToggle={handleToggle} onDelete={handleDelete} onTrigger={handleTrigger} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {sources.map((s) => (
              <MobileSourceCard key={s.id} source={s} onToggle={handleToggle} onDelete={handleDelete} onTrigger={handleTrigger} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No idea sources configured. Click &quot;+ Idea Source&quot; to set up automated scanning.
          </p>
        </div>
      )}

      <CreateIdeaSourceModal open={showSourceModal} onClose={() => setShowSourceModal(false)} onCreated={handleCreated} />
    </section>
  )
}
