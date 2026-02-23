// LinkedIn publishing via Unipile REST API

import { readFile } from "fs/promises"

const DSN = process.env.UNIPILE_DSN || ""
const TOKEN = process.env.UNIPILE_API_KEY || ""
const ACCOUNT_ID = process.env.UNIPILE_ACCOUNT_ID || ""

function getBaseUrl(): string {
  if (!DSN || !TOKEN) throw new Error("Unipile not configured")
  return `https://${DSN}`
}

export async function publishTextPost(caption: string): Promise<{ postId: string; url: string }> {
  const res = await fetch(`${getBaseUrl()}/api/v1/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": TOKEN,
    },
    body: JSON.stringify({
      account_id: ACCOUNT_ID,
      text: caption,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LinkedIn post failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return { postId: data.object?.id || "", url: data.object?.url || "" }
}

export async function publishImagePost(caption: string, imagePath: string): Promise<{ postId: string; url: string }> {
  const imageBuffer = await readFile(imagePath)
  const ext = imagePath.split(".").pop()?.toLowerCase() || "png"
  const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" }
  const mime = mimeMap[ext] || "image/png"

  const form = new FormData()
  form.append("account_id", ACCOUNT_ID)
  form.append("text", caption)
  form.append("media", new Blob([imageBuffer], { type: mime }), `image.${ext}`)

  const res = await fetch(`${getBaseUrl()}/api/v1/posts`, {
    method: "POST",
    headers: { "X-API-KEY": TOKEN },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LinkedIn image post failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return { postId: data.object?.id || "", url: data.object?.url || "" }
}

export async function publishDocumentPost(caption: string, docPath: string): Promise<{ postId: string; url: string }> {
  const docBuffer = await readFile(docPath)

  const form = new FormData()
  form.append("account_id", ACCOUNT_ID)
  form.append("text", caption)
  form.append("media", new Blob([docBuffer], { type: "application/pdf" }), "carousel.pdf")

  const res = await fetch(`${getBaseUrl()}/api/v1/posts`, {
    method: "POST",
    headers: { "X-API-KEY": TOKEN },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LinkedIn document post failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return { postId: data.object?.id || "", url: data.object?.url || "" }
}

export function isPublishingConfigured(): boolean {
  return Boolean(DSN && TOKEN && ACCOUNT_ID)
}
