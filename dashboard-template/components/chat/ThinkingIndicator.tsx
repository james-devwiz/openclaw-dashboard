"use client" // Requires useState, useEffect for step animation; framer-motion for transitions

import { useState, useEffect } from "react"

import { motion } from "framer-motion"
import { CircleDotDashed, CheckCircle2, Loader2 } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ThinkingIndicator() {
  const [steps, setSteps] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => setSteps(2), 1500)
    return () => clearTimeout(t)
  }, [])

  const items = [
    { label: "Reading context...", done: steps > 1 },
    { label: "Considering response...", done: false },
  ]

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-7 w-7 mt-1">
        <AvatarFallback className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">JA</AvatarFallback>
      </Avatar>
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm min-w-[200px]"
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <CircleDotDashed size={14} className="text-blue-500" />
          </motion.div>
          <span className="text-xs font-medium text-muted-foreground">AI Assistant is thinking...</span>
        </div>
        <div className="space-y-1.5">
          {items.slice(0, steps).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              {step.done ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={12} className="text-green-500" />
                </motion.div>
              ) : (
                <Loader2 size={12} className="animate-spin text-blue-500" />
              )}
              {step.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
