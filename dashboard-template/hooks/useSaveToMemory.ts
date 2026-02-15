"use client" // Requires useState for modal open/close state

import { useState, useCallback } from "react"

export function useSaveToMemory() {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")

  const openSaveModal = useCallback((text: string) => {
    setContent(text)
    setIsOpen(true)
  }, [])

  const closeSaveModal = useCallback(() => {
    setIsOpen(false)
    setContent("")
  }, [])

  return { isOpen, content, openSaveModal, closeSaveModal }
}
