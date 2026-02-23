import type { BriefType } from "@/types/brief.types"

// --- Brief block regex patterns ---

const BRIEF_BLOCK_RE = /:::brief\n([\s\S]*?):::end/
const BRIEF_UPDATE_BLOCK_RE = /:::brief-update\n([\s\S]*?):::end/

// --- Exported types ---

export interface BriefBlockMeta {
  type: BriefType
  title: string
  date: string
  content: string
}

export interface BriefUpdateMeta {
  id: string
  content: string
}

// --- Validation ---

const VALID_BRIEF_TYPES = new Set([
  "Morning Brief", "End of Day Report", "Pre-Meeting Brief",
  "Post-Meeting Report", "Weekly Review", "Business Analysis", "Cost Report", "Custom",
])

// --- Internal helpers ---

function parseKeyValueHeader(text: string): { fields: Record<string, string>; body: string } {
  const lines = text.split("\n")
  const fields: Record<string, string> = {}
  let bodyStart = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") {
      bodyStart = i + 1
      break
    }
    const idx = line.indexOf(":")
    if (idx > 0) {
      fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
    bodyStart = i + 1
  }

  return { fields, body: lines.slice(bodyStart).join("\n").trim() }
}

// --- Parsers ---

export function parseBriefBlock(text: string): BriefBlockMeta | null {
  const match = BRIEF_BLOCK_RE.exec(text)
  if (!match) return null

  const { fields, body } = parseKeyValueHeader(match[1])

  const type = fields.type as BriefType
  const title = fields.title
  const date = fields.date
  if (!type || !title || !date) return null
  if (!VALID_BRIEF_TYPES.has(type)) return null

  return { type, title, date, content: body }
}

export function parseBriefUpdateBlock(text: string): BriefUpdateMeta | null {
  const match = BRIEF_UPDATE_BLOCK_RE.exec(text)
  if (!match) return null

  const { fields, body } = parseKeyValueHeader(match[1])

  const id = fields.id
  if (!id) return null

  return { id, content: body }
}

/**
 * Strip brief/task meta blocks from chat text for display.
 * Handles both complete blocks and partial blocks during streaming.
 */
export function stripMetaBlocks(text: string): string {
  const TASK_META_RE = /---task\n([\s\S]*?)\n---/g

  let result = text
    // Strip complete :::brief-update...:::end blocks (check first -- more specific)
    .replace(/:::brief-update\n[\s\S]*?:::end/g, "")
    // Strip complete :::brief...:::end blocks
    .replace(/:::brief\n[\s\S]*?:::end/g, "")
    // Strip task markers
    .replace(TASK_META_RE, "")

  // Handle partial matches during streaming (marker started but no :::end yet)
  const partialBriefUpdate = result.indexOf(":::brief-update")
  if (partialBriefUpdate !== -1) {
    result = result.slice(0, partialBriefUpdate)
  } else {
    const partialBrief = result.indexOf(":::brief")
    if (partialBrief !== -1) {
      result = result.slice(0, partialBrief)
    }
  }

  return result.replace(/\n{3,}$/g, "\n").replace(/^\n+/, "")
}
