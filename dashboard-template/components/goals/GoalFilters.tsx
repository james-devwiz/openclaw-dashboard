"use client" // Requires FilterBar which uses interactive onClick handlers

import FilterBar from "@/components/ui/FilterBar"

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Personal", label: "Personal" },
  { id: "System", label: "System" },
  { id: "Business A", label: "Business A" },
  { id: "Business B", label: "Business B" },
  { id: "Business C", label: "Business C" },
]

interface GoalFiltersProps {
  selected: string
  onChange: (status: string) => void
}

export default function GoalFilters({ selected, onChange }: GoalFiltersProps) {
  return <FilterBar filters={FILTERS} selected={selected} onChange={onChange} />
}
