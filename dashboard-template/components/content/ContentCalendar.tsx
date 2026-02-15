"use client" // Requires useState for month navigation state

import { useState } from "react"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SITE_CONFIG } from "@/lib/site-config"
import { cn } from "@/lib/utils"

import type { ContentItem } from "@/types/index"

interface ContentCalendarProps {
  items: ContentItem[]
  onItemClick: (item: ContentItem) => void
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function ContentCalendar({ items, onItemClick }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayIndex = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const scheduledItems = items.filter((i) => i.scheduledDate)

  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return scheduledItems.filter((i) => i.scheduledDate?.startsWith(dateStr))
  }

  const prev = () => setCurrentDate(new Date(year, month - 1, 1))
  const next = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthLabel = currentDate.toLocaleDateString(SITE_CONFIG.locale, { month: "long", year: "numeric" })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {DAYS.map((d) => (
          <div key={d} className="bg-muted p-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
        ))}
        {Array.from({ length: startDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card p-2 min-h-[80px]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayItems = getItemsForDay(day)
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()

          return (
            <div key={day} className={cn("bg-card p-2 min-h-[80px]", isToday && "bg-blue-50/50 dark:bg-blue-900/10")}>
              <span className={cn(
                "text-xs font-medium",
                isToday ? "text-blue-600 dark:text-blue-400 font-bold" : "text-muted-foreground"
              )}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="w-full text-left px-1 py-0.5 rounded text-[10px] leading-tight truncate bg-claw-blue/10 text-claw-blue hover:bg-claw-blue/20 transition-colors"
                  >
                    {item.title}
                  </button>
                ))}
                {dayItems.length > 2 && (
                  <Badge variant="secondary" className="text-[9px] px-1">
                    +{dayItems.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
