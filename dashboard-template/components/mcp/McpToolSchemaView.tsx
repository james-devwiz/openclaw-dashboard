"use client" // Renders pre-formatted JSON schema content

interface McpToolSchemaViewProps {
  schema: string
}

export default function McpToolSchemaView({ schema }: McpToolSchemaViewProps) {
  let formatted = schema
  try {
    formatted = JSON.stringify(JSON.parse(schema), null, 2)
  } catch { /* already a string or invalid */ }

  return (
    <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-60 text-foreground">
      {formatted || "No schema available"}
    </pre>
  )
}
