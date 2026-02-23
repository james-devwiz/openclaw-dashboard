"use client" // Requires useState, useEffect, useRef for dropdown state and outside-click handling

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"

interface ChatModel {
  id: string
  alias: string
  label: string
  provider: string
}

interface ModelSelectorProps {
  selectedModel: string | null
  onSelectModel: (model: string | null) => void
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [models, setModels] = useState<ChatModel[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiFetch("/api/chat/models")
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen])

  if (models.length === 0) return null

  const current = models.find((m) => m.id === selectedModel) || models[0]

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
          isOpen
            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
        aria-label="Select model"
      >
        {current.label}
        <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[200px] py-1"
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id === models[0].id ? null : model.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                  (selectedModel === model.id || (!selectedModel && model === models[0]))
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <span className="font-medium">{model.label}</span>
                <span className="text-xs text-muted-foreground">{model.provider}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
