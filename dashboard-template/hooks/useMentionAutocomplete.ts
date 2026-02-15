"use client" // Requires useState, useCallback for autocomplete state and keyboard navigation

import { useState, useCallback } from "react"

import { filterMentions } from "@/lib/mention-data"

import type { MentionItem } from "@/types/chat.types"

interface MentionState {
  isOpen: boolean
  query: string
  results: MentionItem[]
  selectedIndex: number
}

const CLOSED: MentionState = { isOpen: false, query: "", results: [], selectedIndex: 0 }

export function useMentionAutocomplete() {
  const [state, setState] = useState<MentionState>(CLOSED)

  const handleInputChange = useCallback((value: string, cursorPos: number) => {
    const before = value.slice(0, cursorPos)
    const atMatch = before.match(/(^|[\s])@(\w*)$/)

    if (!atMatch) {
      if (state.isOpen) setState(CLOSED)
      return
    }

    const query = atMatch[2]
    const results = filterMentions(query)
    setState({ isOpen: true, query, results, selectedIndex: 0 })
  }, [state.isOpen])

  const dismiss = useCallback(() => setState(CLOSED), [])

  const selectItem = useCallback(
    (index: number, currentInput: string, cursorPos: number): { newInput: string; newCursor: number } => {
      const item = state.results[index]
      if (!item) return { newInput: currentInput, newCursor: cursorPos }

      const before = currentInput.slice(0, cursorPos)
      const after = currentInput.slice(cursorPos)
      const atMatch = before.match(/(^|[\s])@(\w*)$/)

      if (!atMatch) return { newInput: currentInput, newCursor: cursorPos }

      const prefix = before.slice(0, before.length - atMatch[2].length - 1)
      const replacement = `@${item.id} `
      const newInput = prefix + replacement + after
      const newCursor = prefix.length + replacement.length

      setState(CLOSED)
      return { newInput, newCursor }
    },
    [state.results],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!state.isOpen || state.results.length === 0) return false

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setState((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % prev.results.length,
        }))
        return true
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setState((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + prev.results.length) % prev.results.length,
        }))
        return true
      }

      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        return true // Caller should call selectItem with current index
      }

      if (e.key === "Escape") {
        e.preventDefault()
        setState(CLOSED)
        return true
      }

      return false
    },
    [state.isOpen, state.results.length],
  )

  return {
    ...state,
    handleInputChange,
    handleKeyDown,
    selectItem,
    dismiss,
  }
}
