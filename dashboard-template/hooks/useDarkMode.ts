"use client" // Requires useState, useEffect, useCallback and browser APIs (localStorage, matchMedia)

import { useState, useEffect, useCallback } from "react"

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("command-centre-dark-mode")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = stored ? stored === "true" : prefersDark
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle("dark", shouldBeDark)
  }, [])

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem("command-centre-dark-mode", String(next))
      document.documentElement.classList.toggle("dark", next)
      return next
    })
  }, [])

  return { isDark, toggle }
}
