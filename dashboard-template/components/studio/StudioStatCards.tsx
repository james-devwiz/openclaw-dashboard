import { FileText, Send, Calendar, Archive } from "lucide-react"
import type { Post } from "@/types"

interface Props { posts: Post[] }

export default function StudioStatCards({ posts }: Props) {
  const drafts = posts.filter((p) => p.stage === "Draft" || p.stage === "Research").length
  const review = posts.filter((p) => p.stage === "Review").length
  const scheduled = posts.filter((p) => p.stage === "Scheduled").length
  const published = posts.filter((p) => p.stage === "Published").length

  const cards = [
    { label: "In Progress", value: drafts, icon: FileText, color: "text-amber-600" },
    { label: "In Review", value: review, icon: Send, color: "text-orange-600" },
    { label: "Scheduled", value: scheduled, icon: Calendar, color: "text-cyan-600" },
    { label: "Published", value: published, icon: Archive, color: "text-green-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <c.icon size={14} className={c.color} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{c.value}</span>
        </div>
      ))}
    </div>
  )
}
