import { ChevronRight, ExternalLink, BookOpen, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import MissingReasons from "./MissingReasons"
import type { SkillInfo } from "@/types/index"

interface SkillRowProps {
  skill: SkillInfo
  isExpanded: boolean
  isBusy: boolean
  onToggle: () => void
  onViewDocs: () => void
  onToggleEnabled: () => void
  onInstall?: () => void
}

const STATUS_BADGE: Record<string, string> = {
  ready: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  missing: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  disabled: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
}

export default function SkillRow({ skill, isExpanded, isBusy, onToggle, onViewDocs, onToggleEnabled, onInstall }: SkillRowProps) {
  return (
    <>
      <tr className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggle}>
        <td className="px-4 py-2.5">
          <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
        </td>
        <td className="px-2 py-2.5 text-center">{skill.emoji}</td>
        <td className="px-4 py-2.5 font-medium text-foreground">{skill.name}</td>
        <td className="px-4 py-2.5">
          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[skill.status])}>
            {skill.status}
          </span>
        </td>
        <td className="px-4 py-2.5 text-xs text-muted-foreground">{skill.source}</td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {skill.status !== "missing" && (
              <label className={cn("relative inline-flex cursor-pointer items-center", isBusy && "opacity-50 pointer-events-none")}>
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={!skill.disabled}
                  onChange={onToggleEnabled}
                  disabled={isBusy}
                  aria-label={`${skill.disabled ? "Enable" : "Disable"} ${skill.name}`}
                />
                <div className="peer h-7 w-12 rounded-full bg-slate-300 dark:bg-gray-600 transition-colors duration-200 peer-checked:bg-green-500" />
                <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out peer-checked:translate-x-5" />
              </label>
            )}
            {onInstall && (
              <Button
                onClick={onInstall}
                size="sm"
                aria-label={`Install ${skill.name}`}
              >
                <Download size={10} /> Install
              </Button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border last:border-0 bg-muted/30">
          <td colSpan={6} className="px-6 py-4">
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm text-foreground leading-relaxed">{skill.description}</p>
              {skill.status === "missing" && <MissingReasons skill={skill} />}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onViewDocs() }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  aria-label={`View full documentation for ${skill.name}`}
                >
                  <BookOpen size={12} aria-hidden="true" />
                  View full documentation
                </button>
                {skill.homepage && (
                  <a
                    href={skill.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    Homepage
                  </a>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
