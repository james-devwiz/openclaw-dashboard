import { CheckCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface LinkedInSettingsProps {
  syncing: boolean
  onSync: () => void
  lastSyncedAt?: string
}

export default function LinkedInSettings({ syncing, onSync, lastSyncedAt }: LinkedInSettingsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Connected via Unipile</span>
          </div>
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground">
              Last sync: {new Date(lastSyncedAt).toLocaleString("en-AU")}
            </span>
          )}
        </div>
        <Button onClick={onSync} disabled={syncing} variant="outline" size="sm"
          aria-label="Sync LinkedIn data">
          {syncing
            ? <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            : <RefreshCw size={12} aria-hidden="true" />}
          Sync Now
        </Button>
      </div>
    </div>
  )
}
