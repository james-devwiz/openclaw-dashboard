"use client" // Requires MemoryBrowser component which uses client-side hooks

import PageHeader from "@/components/layout/PageHeader"
import MemoryBrowser from "@/components/memory/MemoryBrowser"

export default function MemoryPage() {
  return (
    <div>
      <PageHeader
        title="Memory"
        subtitle="Browse and search workspace files — your AI's second brain"
      />
      <MemoryBrowser />
    </div>
  )
}
