"use client" // Requires useState for active tab and selected content item

import { useState } from "react"

import { RefreshCw, Newspaper } from "lucide-react"

import PageHeader from "@/components/layout/PageHeader"
import ContentPipelineBoard from "@/components/content/ContentPipelineBoard"
import ContentCalendar from "@/components/content/ContentCalendar"
import ContentDraftViewer from "@/components/content/ContentDraftViewer"
import EmptyState from "@/components/ui/EmptyState"
import { useContent } from "@/hooks/useContent"
import { cn } from "@/lib/utils"

import type { ContentItem } from "@/types/index"

const TABS = [
  { id: "pipeline", label: "Pipeline" },
  { id: "calendar", label: "Calendar" },
]

export default function ContentPage() {
  const { items, columns, loading, moveContent, refetch } = useContent()
  const [activeTab, setActiveTab] = useState("pipeline")
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)

  return (
    <div>
      <PageHeader
        title="Content Centre"
        subtitle="Pipeline board and content calendar"
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
              aria-label="Refresh content"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        }
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading content...</p>
      ) : items.length === 0 && activeTab === "pipeline" ? (
        <EmptyState
          icon={Newspaper}
          title="No content yet"
          description="Content ideas and drafts will appear here as they're created"
        />
      ) : activeTab === "pipeline" ? (
        <ContentPipelineBoard
          columns={columns}
          onMove={moveContent}
          onItemClick={setSelectedItem}
        />
      ) : (
        <ContentCalendar items={items} onItemClick={setSelectedItem} />
      )}

      <ContentDraftViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
