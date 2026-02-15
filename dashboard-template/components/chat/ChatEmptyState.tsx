"use client" // Requires onClick for quick action buttons; framer-motion for staggered animation

import { motion } from "framer-motion"

interface ChatEmptyStateProps {
  description: string
  quickActions: string[]
  onAction: (action: string) => void
}

export default function ChatEmptyState({ description, quickActions, onAction }: ChatEmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-2">
          How can I help today?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-6" />
        <div className="flex flex-wrap gap-2 justify-center">
          {quickActions.map((action, i) => (
            <motion.button
              key={action}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => onAction(action)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-blue-500/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.08)] transition-all text-sm text-foreground"
            >
              {action}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
