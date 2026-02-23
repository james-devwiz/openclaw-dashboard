// Generate AI drafts for post fields — format-aware, tone-of-voice enforced

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getPostById } from "@/lib/db-posts"
import { TONE_RULES, BANNED_WORDS } from "@/lib/tone-constants"
import { FORMAT_LABELS } from "@/lib/studio-constants"
import type { PostFormat } from "@/types/studio.types"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789"
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ""

const FORMAT_GUIDES: Record<PostFormat, string> = {
  text: "LinkedIn text post. Hook in first line (pattern interrupt). Short paragraphs. End with CTA or question. Use line breaks for readability.",
  carousel: "LinkedIn carousel. Each slide: 1 key idea, 10-15 words max, scannable. Slide 1 = bold hook. Last slide = CTA + contact.",
  short_video: "Short-form video (60s max). Structure: Hook (0-3s grab attention), Problem (3-10s), Solution (10-25s), Proof (25-40s), CTA (40-60s). Script as bullet points.",
  long_video: "Long-form YouTube video. Cold open hook, intro, 3-5 chapters with timestamps, outro + CTA. Show notes with key takeaways.",
  blog: "Blog post. Opening hook, scannable headers, short paragraphs, actionable takeaways. 800-1500 words.",
  quote_card: "Quote card. Punchy quote (under 20 words). Attributed. Post text adds context or story behind the quote.",
}

const FIELD_INSTRUCTIONS: Record<string, string> = {
  hook: "Write 3 hook variants. Each should stop the scroll in under 10 words. Pattern interrupts, curiosity gaps, or bold claims.",
  caption: "Write the full post caption/description. Conversational, value-packed, formatted for the platform.",
  cta: "Write 3 call-to-action variants. Clear, specific, low-friction. Tell them exactly what to do next.",
  body: "Write the full long-form content (article body, show notes, or detailed write-up).",
  scriptNotes: "Write script bullet points. Each bullet = one spoken sentence or beat. Include timing cues.",
  slides: "Write carousel slide text. Return JSON array: [{slideNumber, text, designNotes}]. Slide 1 = hook, last = CTA.",
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { postId, field, instruction } = await request.json()
    if (!field) return NextResponse.json({ error: "field required" }, { status: 400 })

    const post = postId ? getPostById(postId) : null
    const format = post?.format || "text"
    const formatGuide = FORMAT_GUIDES[format]
    const fieldInstruction = FIELD_INSTRUCTIONS[field] || `Write the ${field} field.`

    const systemPrompt = [
      `You are the user's content writer. Generate content for a ${FORMAT_LABELS[format]}.`,
      TONE_RULES, BANNED_WORDS,
      `\nFORMAT GUIDE:\n${formatGuide}`,
      `\nFIELD: ${field}\n${fieldInstruction}`,
      field === "slides"
        ? `\nReturn ONLY valid JSON (no markdown): { "slides": [{slideNumber, text, designNotes}] }`
        : field === "hook" || field === "cta"
          ? `\nReturn ONLY valid JSON (no markdown): { "drafts": ["variant1", "variant2", "variant3"] }`
          : `\nReturn ONLY valid JSON (no markdown): { "draft": "the content" }`,
    ].join("\n\n")

    const context = post ? [
      `Title: ${post.title}`,
      post.topic ? `Topic: ${post.topic}` : "",
      post.hook ? `Current hook: ${post.hook}` : "",
      post.caption ? `Current caption: ${post.caption}` : "",
      post.researchNotes ? `Research: ${post.researchNotes}` : "",
      post.hashtags.length ? `Hashtags: ${post.hashtags.join(", ")}` : "",
    ].filter(Boolean).join("\n") : ""

    const userContent = [
      context, instruction ? `\nInstruction: ${instruction}` : "",
    ].filter(Boolean).join("\n")

    const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        "x-openclaw-agent-id": "main",
        "x-openclaw-session-key": "studio-draft",
      },
      body: JSON.stringify({
        model: "openclaw:main", stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent || `Generate ${field} for a ${FORMAT_LABELS[format]}` },
        ],
      }),
    })

    if (!res.ok) {
      console.error(`Draft gateway error ${res.status}`)
      return NextResponse.json({ error: "Draft generation failed" }, { status: 502 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""

    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim()
      return NextResponse.json(JSON.parse(cleaned))
    } catch {
      return NextResponse.json({ draft: text.trim() })
    }
  })
}
