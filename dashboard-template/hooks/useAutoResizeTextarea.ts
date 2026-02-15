"use client" // Requires useRef, useCallback, useEffect for DOM textarea manipulation

import { useRef, useCallback, useEffect } from "react"

interface UseAutoResizeTextareaOptions {
  minHeight?: number
  maxHeight?: number
}

export function useAutoResizeTextarea({
  minHeight = 56,
  maxHeight = 200,
}: UseAutoResizeTextareaOptions = {}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = `${minHeight}px`
    const scrollHeight = textarea.scrollHeight
    textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
  }, [minHeight, maxHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}
