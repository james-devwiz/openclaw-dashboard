"use client" // Requires React Context API and useDarkMode hook for theme state management

import React, { createContext, useContext, useState } from "react"
import { MotionConfig } from "framer-motion"

import { useDarkMode } from "@/hooks/useDarkMode"

interface LayoutContextType {
  isDark: boolean
  toggleDark: () => void
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider")
  return ctx
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { isDark, toggle } = useDarkMode()
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      <LayoutContext.Provider
        value={{
          isDark,
          toggleDark: toggle,
          isMobileMenuOpen,
          setMobileMenuOpen,
        }}
      >
        {children}
      </LayoutContext.Provider>
    </MotionConfig>
  )
}
