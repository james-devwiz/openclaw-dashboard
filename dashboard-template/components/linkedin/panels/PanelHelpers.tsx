// Shared panel section + detail components

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}

export function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs mt-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

export function parseJson<T>(str?: string): T | null {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

export function formatDate(iso?: string): string {
  if (!iso) return "\u2014"
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane",
  })
}
