"use client" // Requires FilterBar which uses interactive onClick handlers

import FilterBar from "@/components/ui/FilterBar"
import { SITE_CONFIG } from "@/lib/site-config"

interface GoalFiltersProps {
  selected: string
  onChange: (status: string) => void
}

export default function GoalFilters({ selected, onChange }: GoalFiltersProps) {
  return <FilterBar filters={SITE_CONFIG.goalFilterChips} selected={selected} onChange={onChange} />
}
