"use client" // Requires useGlobalSearch hook for Cmd+K state and keyboard navigation

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Search, Loader2 } from "lucide-react"

import SearchResultItem from "./SearchResultItem"
import { useGlobalSearch } from "@/hooks/useGlobalSearch"

export default function SearchDialog() {
  const router = useRouter()
  const { results, isOpen, query, loading, search, close } = useGlobalSearch()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      router.push(results[selectedIndex].href)
      close()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" role="dialog" aria-label="Global search">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" />
          ) : (
            <Search size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search goals, tasks, content, approvals, memory..."
            className="w-full py-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
          />
          <kbd className="hidden sm:block px-2 py-0.5 rounded border border-border text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
            {results.map((result, i) => (
              <SearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                isSelected={i === selectedIndex}
                onClick={() => { router.push(result.href); close() }}
              />
            ))}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!query && (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Type to search across all sections. Use arrow keys to navigate.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
