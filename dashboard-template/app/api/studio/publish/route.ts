// Publish a post to LinkedIn via Unipile

import { NextRequest, NextResponse } from "next/server"
import { withActivitySource } from "@/lib/activity-source"
import { getPostById, updatePost } from "@/lib/db-posts"
import { updatePlatform } from "@/lib/db-post-platforms"
import { getMedia } from "@/lib/db-post-media"
import { publishTextPost, publishImagePost, publishDocumentPost } from "@/lib/linkedin-publisher"
import { logActivity } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { platformEntryId, postId } = await request.json()
    if (!platformEntryId || !postId) {
      return NextResponse.json({ error: "platformEntryId and postId required" }, { status: 400 })
    }

    const post = getPostById(postId)
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const platformEntry = post.platforms.find((p) => p.id === platformEntryId)
    if (!platformEntry) return NextResponse.json({ error: "Platform entry not found" }, { status: 404 })

    if (platformEntry.platform !== "linkedin") {
      return NextResponse.json({ error: "Only LinkedIn publishing is supported" }, { status: 400 })
    }

    const caption = platformEntry.captionOverride || post.caption
    if (!caption) {
      return NextResponse.json({ error: "No caption to publish" }, { status: 400 })
    }

    // Add hashtags to caption
    const hashtags = post.hashtags.length ? "\n\n" + post.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`).join(" ") : ""
    const fullCaption = caption + hashtags

    try {
      const media = getMedia(postId)
      let result: { postId: string; url: string }

      if (media.length > 0 && media[0].mediaType === "document") {
        result = await publishDocumentPost(fullCaption, media[0].filePath)
      } else if (media.length > 0 && media[0].mediaType === "image") {
        result = await publishImagePost(fullCaption, media[0].filePath)
      } else {
        result = await publishTextPost(fullCaption)
      }

      updatePlatform(platformEntryId, {
        platformStatus: "published",
        publishedAt: new Date().toISOString(),
        publishedUrl: result.url,
        platformPostId: result.postId,
      })

      // Move post to Published stage if not already
      if (post.stage !== "Published") {
        updatePost(postId, { stage: "Published" })
      }

      logActivity({ entityType: "post", entityId: postId, entityName: post.title, action: "published", detail: `Published to LinkedIn` })

      return NextResponse.json({ success: true, url: result.url, platformPostId: result.postId })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error("Publish failed:", msg)
      updatePlatform(platformEntryId, { platformStatus: "failed", error: msg })
      return NextResponse.json({ error: "Publishing failed" }, { status: 502 })
    }
  })
}
