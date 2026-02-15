"use client" // Requires textarea ref and onChange for editing

import { useRef, useEffect } from "react"

interface MemoryEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function MemoryEditor({ content, onChange }: MemoryEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [content])

  return (
    <textarea
      ref={ref}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[400px] p-4 rounded-lg border border-border bg-card text-sm text-foreground font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-claw-blue/20"
      aria-label="Edit file content"
      spellCheck={false}
    />
  )
}
