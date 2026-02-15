import { NextRequest, NextResponse } from "next/server"
import { getDocuments, getDocumentCount, createDocument, updateDocument, deleteDocument } from "@/lib/db-documents"
import { withActivitySource } from "@/lib/activity-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || undefined
  const search = searchParams.get("search") || undefined
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  const documents = getDocuments({ category, search, limit, offset })
  const total = getDocumentCount({ category, search })
  return NextResponse.json({ documents, total })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { category, title, content, tags, source } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const doc = createDocument({ category, title, content, tags, source })
    return NextResponse.json({ document: doc }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const doc = updateDocument(id, updates)
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    return NextResponse.json({ document: doc })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteDocument(id)
    return NextResponse.json({ success: true })
  })
}
