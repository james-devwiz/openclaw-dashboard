"use client" // Requires useState for search, filter, expanded row, selected skill, and busy state

import { useState, useMemo } from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { toggleSkill } from "@/services/architecture.service"
import SkillRow from "./SkillRow"
import SkillDetailPanel from "./SkillDetailPanel"
import SkillInstallModal from "./SkillInstallModal"
import type { SkillInfo, SkillStatus } from "@/types/index"

type FilterType = "all" | SkillStatus

interface SkillsTableProps {
  skills: SkillInfo[]
  onRefresh: () => void
}

export default function SkillsTable({ skills, onRefresh }: SkillsTableProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillInfo | null>(null)
  const [installSkillName, setInstallSkillName] = useState<string | null>(null)
  const [busySkill, setBusySkill] = useState<string | null>(null)

  const readyCount = skills.filter((s) => s.status === "ready").length
  const missingCount = skills.filter((s) => s.status === "missing").length
  const disabledCount = skills.filter((s) => s.status === "disabled").length

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "All", count: skills.length },
    { id: "ready", label: "Ready", count: readyCount },
    { id: "missing", label: "Missing", count: missingCount },
    { id: "disabled", label: "Disabled", count: disabledCount },
  ]

  const filtered = useMemo(() => {
    let result = skills
    if (filter !== "all") result = result.filter((s) => s.status === filter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => {
      const order: Record<string, number> = { ready: 0, disabled: 1, missing: 2 }
      if (a.status !== b.status) return (order[a.status] ?? 3) - (order[b.status] ?? 3)
      return a.name.localeCompare(b.name)
    })
  }, [skills, filter, search])

  const handleToggle = async (skill: SkillInfo) => {
    setBusySkill(skill.name)
    try {
      await toggleSkill(skill.name, skill.status === "disabled")
      onRefresh()
    } catch (err) {
      console.error("Toggle failed:", err)
      alert(`Failed to toggle ${skill.name}. Please check the gateway logs.`)
    } finally {
      setBusySkill(null)
    }
  }

  const canInstall = (skill: SkillInfo) =>
    skill.status === "missing" && skill.missing.os.length === 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search skills"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                filter === f.id
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium w-12"></th>
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((skill) => (
              <SkillRow
                key={skill.name}
                skill={skill}
                isExpanded={expandedSkill === skill.name}
                isBusy={busySkill === skill.name}
                onToggle={() => setExpandedSkill(expandedSkill === skill.name ? null : skill.name)}
                onViewDocs={() => setSelectedSkill(skill)}
                onToggleEnabled={() => handleToggle(skill)}
                onInstall={canInstall(skill) ? () => setInstallSkillName(skill.name) : undefined}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No skills match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SkillDetailPanel skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      <SkillInstallModal
        skillName={installSkillName}
        onClose={() => setInstallSkillName(null)}
        onInstalled={onRefresh}
      />
    </div>
  )
}
