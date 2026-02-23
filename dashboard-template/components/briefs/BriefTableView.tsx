"use client" // Orchestrates table view sub-components with useBriefSearch hook

import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useBriefSearch } from "@/hooks/useBriefSearch"
import { BriefKindTabs } from "@/components/briefs/BriefKindTabs"
import { BriefSearchBar } from "@/components/briefs/BriefSearchBar"
import { BriefTypeTabs } from "@/components/briefs/BriefTypeTabs"
import { BriefStats } from "@/components/briefs/BriefStats"
import { BriefTable } from "@/components/briefs/BriefTable"
import { BriefPagination } from "@/components/briefs/BriefPagination"

export function BriefTableView() {
  const {
    briefs, total, typeCounts, loading, page, pageSize,
    kind, setKind, briefType, setBriefType, source, setSource, search, setSearch,
    from, setFrom, to, setTo, sortBy, sortDir, toggleSort,
    setPage, removeBrief, refetch,
  } = useBriefSearch()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <BriefKindTabs activeKind={kind} onKindChange={setKind} />
        <Button
          variant="outline"
          size="icon"
          onClick={refetch}
          aria-label="Refresh results"
        >
          <RefreshCw size={16} aria-hidden="true" />
        </Button>
      </div>

      <BriefSearchBar
        search={search}
        onSearchChange={setSearch}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        source={source}
        onSourceChange={setSource}
      />

      <BriefTypeTabs
        typeCounts={typeCounts}
        activeType={briefType}
        onTypeChange={setBriefType}
        kind={kind}
      />

      <BriefStats total={total} typeCounts={typeCounts} />

      <BriefTable
        briefs={briefs}
        sortBy={sortBy}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onDelete={removeBrief}
        loading={loading}
      />

      <BriefPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  )
}
