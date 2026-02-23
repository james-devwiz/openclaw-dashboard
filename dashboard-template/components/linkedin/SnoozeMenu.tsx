"use client" // Requires useState for dropdown visibility

import { useState, useRef, useEffect } from "react"
import { Clock } from "lucide-react"

interface SnoozeMenuProps {
  onSnooze: (until: string) => void
}

export default function SnoozeMenu({ onSnooze }: SnoozeMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const snoozeFor = (ms: number) => {
    onSnooze(new Date(Date.now() + ms).toISOString())
    setOpen(false)
  }

  const snoozeUntilNextMorning = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    onSnooze(d.toISOString())
    setOpen(false)
  }

  const snoozeUntilNextMonday = () => {
    const d = new Date()
    const day = d.getDay()
    const daysUntilMon = day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + daysUntilMon)
    d.setHours(9, 0, 0, 0)
    onSnooze(d.toISOString())
    setOpen(false)
  }

  const options = [
    { label: "1 hour", action: () => snoozeFor(3600000) },
    { label: "3 hours", action: () => snoozeFor(10800000) },
    { label: "Tomorrow 9am", action: snoozeUntilNextMorning },
    { label: "Next Monday 9am", action: snoozeUntilNextMonday },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
        aria-label="Snooze thread"
      >
        <Clock size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
          {options.map((o) => (
            <button key={o.label} onClick={o.action}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
