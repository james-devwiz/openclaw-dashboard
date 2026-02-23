"use client" // Requires useState for active tab, selected post, modal states, and idea interactions

import { useState } from "react"
import { RefreshCw, Plus, Clapperboard, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageHeader from "@/components/layout/PageHeader"
import StudioPipelineBoard from "@/components/studio/StudioPipelineBoard"
import StudioStatCards from "@/components/studio/StudioStatCards"
import PublishingCalendar from "@/components/studio/PublishingCalendar"
import PostComposer from "@/components/studio/PostComposer"
import PostSlideOver from "@/components/studio/PostSlideOver"
import IdeasTab from "@/components/content/IdeasTab"
import ContentDraftViewer from "@/components/content/ContentDraftViewer"
import CreateIdeaModal from "@/components/content/CreateIdeaModal"
import PromoteToTaskModal from "@/components/content/PromoteToTaskModal"
import PromoteToPipelineModal from "@/components/content/PromoteToPipelineModal"
import EmptyState from "@/components/ui/EmptyState"
import { useStudio } from "@/hooks/useStudio"
import { createContentApi, promoteToTaskApi } from "@/services/content.service"
import { cn } from "@/lib/utils"

import type { Post, ContentItem, ContentFormat } from "@/types"
import type { CreateContentResult } from "@/services/content.service"

const TABS = [
  { id: "pipeline", label: "Pipeline" },
  { id: "calendar", label: "Calendar" },
  { id: "ideas", label: "Ideas" },
]

export default function StudioPage() {
  const { posts, columns, loading, addPost, movePost, removePost, refetch } = useStudio()
  const [activeTab, setActiveTab] = useState("pipeline")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<ContentItem | null>(null)
  const [showCreateIdea, setShowCreateIdea] = useState(false)
  const [promoteItem, setPromoteItem] = useState<ContentItem | null>(null)
  const [promotePipelineItem, setPromotePipelineItem] = useState<ContentItem | null>(null)

  const handlePostUpdate = (updated: Post) => {
    setSelectedPost(updated)
    refetch()
  }

  const handleCreateIdea = async (input: Parameters<typeof createContentApi>[0]): Promise<CreateContentResult> => {
    return createContentApi(input)
  }

  const handlePromoteToTask = async (contentId: string, opts: { category?: string; priority?: string; comment?: string }) => {
    return promoteToTaskApi(contentId, opts)
  }

  const handlePromotePipeline = async (contentId: string, formats: ContentFormat[], contentType: string) => {
    const { promoteToPipelineApi } = await import("@/services/content.service")
    const result = await promoteToPipelineApi(contentId, { formats, contentType })
    refetch()
    return result
  }

  return (
    <div>
      <PageHeader
        title="Content Studio"
        subtitle="Plan, create, and publish content across platforms"
        actions={
          <div className="flex items-center gap-3">
            {activeTab === "ideas" ? (
              <Button size="sm" onClick={() => setShowCreateIdea(true)} aria-label="Create new idea">
                <Plus size={14} aria-hidden="true" />
                <Lightbulb size={14} aria-hidden="true" />
                Idea
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowComposer(true)} aria-label="Create new post">
                <Plus size={14} aria-hidden="true" />
                New Post
              </Button>
            )}

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

            <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
              <RefreshCw size={16} aria-hidden="true" />
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading posts...</p>
      ) : activeTab === "pipeline" ? (
        <>
          <StudioStatCards posts={posts} />
          {posts.filter((p) => p.stage !== "Idea").length === 0 ? (
            <EmptyState icon={Clapperboard} title="No posts yet" description="Create a post to start building your content pipeline" />
          ) : (
            <StudioPipelineBoard columns={columns} onMove={movePost} onItemClick={setSelectedPost} />
          )}
        </>
      ) : activeTab === "calendar" ? (
        <PublishingCalendar posts={posts} onItemClick={setSelectedPost} />
      ) : (
        <IdeasTab
          onItemClick={setSelectedIdea}
          onPromoteToPipeline={(item) => { setSelectedIdea(null); setPromotePipelineItem(item) }}
          onPromoteToTask={(item) => { setSelectedIdea(null); setPromoteItem(item) }}
        />
      )}

      <PostSlideOver
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdate={handlePostUpdate}
        onDelete={(id) => { removePost(id); setSelectedPost(null) }}
      />

      <PostComposer open={showComposer} onClose={() => setShowComposer(false)} onSubmit={addPost} />

      <ContentDraftViewer
        item={selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onPromoteToTask={(item) => { setSelectedIdea(null); setPromoteItem(item) }}
        onPromoteToPipeline={(item) => { setSelectedIdea(null); setPromotePipelineItem(item) }}
      />

      <CreateIdeaModal
        open={showCreateIdea}
        onClose={() => setShowCreateIdea(false)}
        onSubmit={handleCreateIdea}
      />

      {promoteItem && (
        <PromoteToTaskModal
          item={promoteItem}
          open={!!promoteItem}
          onClose={() => setPromoteItem(null)}
          onPromote={handlePromoteToTask}
        />
      )}

      {promotePipelineItem && (
        <PromoteToPipelineModal
          item={promotePipelineItem}
          open={!!promotePipelineItem}
          onClose={() => setPromotePipelineItem(null)}
          onPromote={handlePromotePipeline}
        />
      )}
    </div>
  )
}
