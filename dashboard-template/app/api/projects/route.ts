import { NextRequest, NextResponse } from "next/server"
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/db-projects"
import { withActivitySource } from "@/lib/activity-source"

export async function GET() {
  const projects = getProjects()
  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { name, description, instructions, icon, color } = body

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const project = createProject({ name, description, instructions, icon, color })
    return NextResponse.json({ project }, { status: 201 })
  })
}

export async function PATCH(request: NextRequest) {
  return withActivitySource(request, async () => {
    const body = await request.json()
    const { projectId, ...updates } = body

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const project = updateProject(projectId, updates)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ project })
  })
}

export async function DELETE(request: NextRequest) {
  return withActivitySource(request, async () => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 })
    }

    deleteProject(id)
    return NextResponse.json({ success: true })
  })
}
