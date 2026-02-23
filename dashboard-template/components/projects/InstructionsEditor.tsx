"use client" // Requires useState for edit state, useRef/useCallback for debounced save

import { useState, useRef, useCallback, useEffect } from "react"
import { Save, Check } from "lucide-react"

import { Button } from "@/components/ui/button"

interface InstructionsEditorProps {
  instructions: string
  onSave: (instructions: string) => void
}

export default function InstructionsEditor({ instructions, onSave }: InstructionsEditorProps) {
  const [value, setValue] = useState(instructions)
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setValue(instructions)
  }, [instructions])

  const debouncedSave = useCallback((text: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      onSave(text)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 1500)
  }, [onSave])

  const handleChange = (text: string) => {
    setValue(text)
    debouncedSave(text)
  }

  const handleManualSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    onSave(value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">System Instructions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            These instructions are prepended to every chat message in this project.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleManualSave}>
          {saved ? <Check size={14} className="text-green-500" /> : <Save size={14} />}
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleManualSave}
        className="flex-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px]"
        placeholder="Enter system instructions for this project...&#10;&#10;Example: You are a senior TypeScript developer. Always use functional patterns and avoid classes."
      />
    </div>
  )
}
