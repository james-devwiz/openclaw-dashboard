"use client" // Requires useRef, useEffect for scroll-into-view; renders interactive dropdown

import { useRef, useEffect } from "react"

import { AnimatePresence, motion } from "framer-motion"
import { Wrench, FileText, Cpu, Settings, Users, Blocks } from "lucide-react"

import { cn } from "@/lib/utils"

import type { MentionItem, MentionCategory } from "@/types/chat.types"

interface MentionAutocompleteProps {
  isOpen: boolean
  results: MentionItem[]
  selectedIndex: number
  onSelect: (index: number) => void
}

const CATEGORY_CONFIG: Record<MentionCategory, { icon: typeof Wrench; color: string }> = {
  Agents: { icon: Users, color: "text-orange-500" },
  "Sub-Agents": { icon: Blocks, color: "text-pink-500" },
  Skills: { icon: Wrench, color: "text-blue-500" },
  Context: { icon: FileText, color: "text-violet-500" },
  Models: { icon: Cpu, color: "text-emerald-500" },
  System: { icon: Settings, color: "text-amber-500" },
}

function groupByCategory(items: MentionItem[]): [MentionCategory, MentionItem[]][] {
  const groups = new Map<MentionCategory, MentionItem[]>()
  for (const item of items) {
    const list = groups.get(item.category) || []
    list.push(item)
    groups.set(item.category, list)
  }
  return Array.from(groups.entries())
}

export default function MentionAutocomplete({
  isOpen,
  results,
  selectedIndex,
  onSelect,
}: MentionAutocompleteProps) {
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  const grouped = groupByCategory(results)
  let flatIndex = -1

  return (
    <AnimatePresence>
      {isOpen && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto z-50"
        >
          {grouped.map(([category, items]) => {
            const config = CATEGORY_CONFIG[category]
            const Icon = config.icon
            return (
              <div key={category}>
                <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                  <Icon size={10} className={config.color} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {category}
                  </span>
                </div>
                {items.map((item) => {
                  flatIndex++
                  const idx = flatIndex
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={item.id}
                      ref={isSelected ? selectedRef : undefined}
                      onClick={() => onSelect(idx)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                        isSelected ? "bg-accent" : "hover:bg-accent/50",
                      )}
                    >
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
