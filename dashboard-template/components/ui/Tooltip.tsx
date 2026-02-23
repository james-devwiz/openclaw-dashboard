"use client" // Requires useState for hover state management

import { useState, useRef, useCallback } from "react"

interface TooltipProps {
  label: string
  children: React.ReactNode
  position?: "top" | "bottom"
}

export default function Tooltip({ label, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 400)
  }, [])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const posClass = position === "top"
    ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
    : "top-full mt-2 left-1/2 -translate-x-1/2"

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute ${posClass} whitespace-nowrap px-2 py-1 rounded-md bg-foreground text-background
            text-[11px] font-medium shadow-md pointer-events-none z-50 animate-in fade-in duration-150`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
