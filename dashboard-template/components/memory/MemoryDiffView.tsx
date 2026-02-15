"use client" // Requires rendering diff lines with conditional styling

interface MemoryDiffViewProps {
  diff: string
}

export default function MemoryDiffView({ diff }: MemoryDiffViewProps) {
  if (!diff) return <p className="text-xs text-muted-foreground">No changes</p>

  const lines = diff.split("\n")

  return (
    <pre className="text-xs font-mono rounded-lg bg-muted/50 p-3 overflow-x-auto">
      {lines.map((line, i) => {
        let className = "text-muted-foreground"
        if (line.startsWith("+") && !line.startsWith("+++")) className = "text-green-600 dark:text-green-400"
        else if (line.startsWith("-") && !line.startsWith("---")) className = "text-red-500 dark:text-red-400"
        else if (line.startsWith("@@")) className = "text-blue-500 dark:text-blue-400"

        return (
          <div key={i} className={className}>
            {line}
          </div>
        )
      })}
    </pre>
  )
}
