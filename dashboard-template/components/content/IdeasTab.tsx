"use client" // Requires useIdeas hook for table state management

import IdeaCategoryTabs from "./IdeaCategoryTabs"
import IdeaSearchBar from "./IdeaSearchBar"
import IdeaTable from "./IdeaTable"
import IdeaSourcesSection from "./IdeaSourcesSection"
import { BriefPagination } from "@/components/briefs/BriefPagination"
import { useIdeas } from "@/hooks/useIdeas"

import type { ContentItem } from "@/types/index"

interface IdeasTabProps {
  onItemClick: (item: ContentItem) => void
  onPromoteToPipeline: (item: ContentItem) => void
  onPromoteToTask: (item: ContentItem) => void
}

export default function IdeasTab({ onItemClick, onPromoteToPipeline, onPromoteToTask }: IdeasTabProps) {
  const {
    ideas, total, categoryCounts, loading, page, pageSize,
    category, setCategory, search, setSearch,
    sortBy, sortDir, toggleSort, setPage,
  } = useIdeas()

  return (
    <div className="space-y-8">
      <section>
        <IdeaCategoryTabs categoryCounts={categoryCounts} activeCategory={category} onCategoryChange={setCategory} />
        <IdeaSearchBar search={search} onSearchChange={setSearch} />
        <IdeaTable
          ideas={ideas} loading={loading}
          sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}
          onItemClick={onItemClick} onPromoteToPipeline={onPromoteToPipeline} onPromoteToTask={onPromoteToTask}
        />
        <BriefPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </section>

      <IdeaSourcesSection />
    </div>
  )
}
