"use client" // Requires useState for expandable rows and interactive sort headers

import { useState } from "react"

import { ChevronDown, ChevronUp, ExternalLink, Eye, ArrowUpRight, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IDEA_CATEGORY_COLORS, CONTENT_FORMAT_COLORS } from "@/lib/content-constants"

import type { ContentItem, IdeaCategory, ContentFormat } from "@/types/index"

interface IdeaTableProps {
  ideas: ContentItem[]
  loading: boolean
  sortBy: string
  sortDir: "ASC" | "DESC"
  onSort: (col: string) => void
  onItemClick: (item: ContentItem) => void
  onPromoteToPipeline: (item: ContentItem) => void
  onPromoteToTask: (item: ContentItem) => void
}

export default function IdeaTable({ ideas, loading, sortBy, sortDir, onSort, onItemClick, onPromoteToPipeline, onPromoteToTask }: IdeaTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) return <TableSkeleton />
  if (ideas.length === 0) return <EmptyIdeas />

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <SortHeader label="Title" col="title" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Categories</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Formats</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Score</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Source</th>
            <SortHeader label="Priority" col="priority" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Created" col="createdAt" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {ideas.map((idea) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              isExpanded={expanded.has(idea.id)}
              onToggle={() => toggle(idea.id)}
              onOpen={() => onItemClick(idea)}
              onPromotePipeline={() => onPromoteToPipeline(idea)}
              onPromoteTask={() => onPromoteToTask(idea)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IdeaRow({ idea, isExpanded, onToggle, onOpen, onPromotePipeline, onPromoteTask }: {
  idea: ContentItem; isExpanded: boolean; onToggle: () => void
  onOpen: () => void; onPromotePipeline: () => void; onPromoteTask: () => void
}) {
  const isContent = idea.ideaCategories?.includes("Content Idea")
  const hasPromotedTask = !!idea.promotedTaskId
  const hasPromotedPipeline = !!idea.promotedPipelineIds?.length

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-3 py-2.5 font-medium text-foreground max-w-[280px] truncate">{idea.title}</td>
        <td className="px-3 py-2"><CategoryPills cats={idea.ideaCategories} /></td>
        <td className="px-3 py-2"><FormatPills formats={idea.contentFormats} /></td>
        <td className="px-3 py-2"><ScoreBadge score={idea.vetScore} /></td>
        <td className="px-3 py-2">
          {idea.sourceUrl ? (
            <a href={idea.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {idea.sourceType || "Link"} <ExternalLink size={10} aria-hidden="true" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">{idea.source}</span>
          )}
        </td>
        <td className="px-3 py-2"><PriorityBadge priority={idea.priority} /></td>
        <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString("en-AU")}</td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border bg-muted/10">
          <td colSpan={7} className="px-4 py-4">
            <div className="space-y-3 max-w-2xl">
              {idea.topic && <ExpandSection label="Description" content={idea.topic} />}
              {idea.researchNotes && <ExpandSection label="Research Notes" content={idea.researchNotes} />}
              {idea.vetReasoning && <ExpandSection label="AI Assessment" content={idea.vetReasoning} />}
              {idea.vetEvidence && <ExpandSection label="Evidence" content={idea.vetEvidence} />}
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={(e) => { e.stopPropagation(); onOpen() }} variant="outline" size="sm" aria-label="Open in slide-over">
                  <Eye size={12} aria-hidden="true" /> Open
                </Button>
                {isContent && !hasPromotedPipeline && (
                  <Button onClick={(e) => { e.stopPropagation(); onPromotePipeline() }} size="sm" className="bg-purple-600 hover:bg-purple-700" aria-label="Promote to pipeline">
                    <Layers size={12} aria-hidden="true" /> To Pipeline
                  </Button>
                )}
                {!hasPromotedTask && (
                  <Button onClick={(e) => { e.stopPropagation(); onPromoteTask() }} size="sm" aria-label="Promote to task">
                    <ArrowUpRight size={12} aria-hidden="true" /> To Task
                  </Button>
                )}
                {hasPromotedTask && <Badge variant="success" className="text-[10px]">Task Created</Badge>}
                {hasPromotedPipeline && <Badge variant="secondary" className="text-[10px]">{idea.promotedPipelineIds!.length} Pipeline Items</Badge>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function ExpandSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
    </div>
  )
}

function CategoryPills({ cats }: { cats?: IdeaCategory[] }) {
  if (!cats?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {cats.map((cat) => {
        const c = IDEA_CATEGORY_COLORS[cat]
        return c ? <span key={cat} className={cn(c.bg, c.text, "text-[10px] px-1.5 py-0.5 rounded-full")}>{cat.replace(" Idea", "").replace(" Solution", "")}</span> : null
      })}
    </div>
  )
}

function FormatPills({ formats }: { formats?: ContentFormat[] }) {
  if (!formats?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {formats.map((f) => {
        const c = CONTENT_FORMAT_COLORS[f]
        return c ? <span key={f} className={cn(c.bg, c.text, "text-[10px] px-1.5 py-0.5 rounded-full")}>{f}</span> : null
      })}
    </div>
  )
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-xs text-muted-foreground">—</span>
  const color = score >= 8 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    : score >= 5 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  return <span className={cn(color, "text-[10px] font-bold px-2 py-0.5 rounded-full")}>{score}/10</span>
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = priority === "High" ? "text-red-500" : priority === "Low" ? "text-gray-400" : "text-amber-500"
  return <span className={cn("text-xs font-medium", color)}>{priority}</span>
}

function SortHeader({ label, col, sortBy, sortDir, onSort }: {
  label: string; col: string; sortBy: string; sortDir: string; onSort: (col: string) => void
}) {
  const active = sortBy === col
  return (
    <th className="text-left px-3 py-2">
      <button onClick={() => onSort(col)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        {label}
        {active && (sortDir === "ASC" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>
    </th>
  )
}
const TableSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6 space-y-3">
    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}
  </div>
)
const EmptyIdeas = () => (
  <div className="rounded-xl border border-border bg-card p-8 text-center">
    <p className="text-sm text-muted-foreground">No ideas found matching your filters.</p>
  </div>
)
