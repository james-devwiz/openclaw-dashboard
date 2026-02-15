"use client" // Requires useState, useEffect for sidebar collapse state and localStorage; usePathname for active nav

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SITE_CONFIG } from "@/lib/site-config"

import {
  LayoutDashboard,
  MessageCircle,
  FolderOpen,
  Target,
  Newspaper,
  Bell,
  Brain,
  Sun as SunIcon,
  Network,
  HeartPulse,
  FileText,
  ChevronsLeft,
  Menu,
  Moon,
  Sun,
  Zap,
  Activity,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useLayout } from "./LayoutProvider"
import { useApprovals } from "@/hooks/useApprovals"
import { useChatUnread } from "@/hooks/useChatUnread"

type BadgeKey = "approvals" | "chat"

const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof LayoutDashboard; badge?: BadgeKey }> = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle, badge: "chat" },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/goals", label: "Goals & Tasks", icon: Target },
  { href: "/content", label: "Content Centre", icon: Newspaper },
  { href: "/approvals", label: "Approvals", icon: Bell, badge: "approvals" },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/brief", label: "Briefs & Reports", icon: SunIcon },
  { href: "/architecture", label: "Architecture", icon: Network },
  { href: "/heartbeat", label: "Heartbeat", icon: HeartPulse },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isDark, toggleDark, isMobileMenuOpen, setMobileMenuOpen } = useLayout()
  const { pendingCount } = useApprovals()
  const { total: chatUnreadTotal } = useChatUnread()
  const [open, setOpen] = useState(true)

  const badgeCounts: Record<BadgeKey, number> = {
    approvals: pendingCount,
    chat: chatUnreadTotal,
  }

  useEffect(() => {
    const stored = localStorage.getItem("command-centre-sidebar")
    if (stored === "collapsed") setOpen(false)
  }, [])

  const toggleOpen = () => {
    setOpen((prev) => {
      localStorage.setItem("command-centre-sidebar", prev ? "collapsed" : "expanded")
      return !prev
    })
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-muted-foreground md:hidden shadow-sm"
        aria-label="Toggle navigation menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed on mobile, sticky on desktop */}
      <nav
        className={cn(
          "shrink-0 border-r border-border bg-card p-2 shadow-sm flex flex-col transition-all duration-300 ease-in-out",
          open ? "w-64" : "w-16",
          "fixed top-0 left-0 h-screen z-40 md:sticky md:top-0 md:z-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo + collapse toggle */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-center justify-between rounded-md p-2">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Zap size={18} className="text-white" aria-hidden="true" />
              </div>
              {open && (
                <div>
                  <span className="block text-sm font-semibold text-foreground">{SITE_CONFIG.dashboardTitle}</span>
                  <span className="block text-xs text-muted-foreground">{SITE_CONFIG.aiName}</span>
                </div>
              )}
            </div>
            <button
              onClick={toggleOpen}
              className="hidden md:grid size-8 place-content-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronsLeft className={cn("h-4 w-4 transition-transform duration-300", !open && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <div className="space-y-1.5 mb-8">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="grid h-full w-12 place-content-center">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                {open && (
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                )}
                {item.badge && badgeCounts[item.badge] > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold mr-3">
                    {badgeCounts[item.badge]}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Dark mode toggle — pinned to bottom */}
        <div className="mt-auto pb-2">
          <button
            onClick={toggleDark}
            className="grid size-10 place-content-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mx-auto"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

      </nav>
    </>
  )
}
