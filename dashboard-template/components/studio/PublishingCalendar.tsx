"use client" // Requires useState for month navigation state

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import CalendarPostChip from "./CalendarPostChip"
import type { Post } from "@/types"

interface Props {
  posts: Post[]
  onItemClick: (post: Post) => void
}

export default function PublishingCalendar({ posts, onItemClick }: Props) {
  const [monthOffset, setMonthOffset] = useState(0)
  const now = new Date()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const monthLabel = viewMonth.toLocaleDateString("en-AU", { month: "long", year: "numeric" })

  // Build calendar entries from platform scheduledAt/publishedAt dates
  const calendarEntries: Map<number, { post: Post; entryId: string }[]> = new Map()
  for (const post of posts) {
    for (const plat of post.platforms) {
      const dateStr = plat.publishedAt || plat.scheduledAt
      if (!dateStr) continue
      const d = new Date(dateStr)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        const list = calendarEntries.get(day) || []
        list.push({ post, entryId: plat.id })
        calendarEntries.set(day, list)
      }
    }
  }

  const today = now.getDate()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1.5 rounded hover:bg-muted" aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1.5 rounded hover:bg-muted" aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}

        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card min-h-[80px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const entries = calendarEntries.get(day) || []
          const isToday = isCurrentMonth && day === today
          return (
            <div key={day} className={cn("bg-card min-h-[80px] p-1", isToday && "ring-2 ring-inset ring-blue-500")}>
              <span className={cn("text-xs font-medium", isToday ? "text-blue-600" : "text-muted-foreground")}>{day}</span>
              <div className="mt-1 space-y-0.5">
                {entries.slice(0, 3).map((e) => {
                  const plat = e.post.platforms.find((p) => p.id === e.entryId)
                  if (!plat) return null
                  return <CalendarPostChip key={e.entryId} post={e.post} platformEntry={plat} onClick={onItemClick} />
                })}
                {entries.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{entries.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
