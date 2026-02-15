export interface Project {
  id: string
  name: string
  description: string
  instructions: string
  icon: string
  color: string
  archived: number
  createdAt: string
  updatedAt: string
  fileCount?: number
  sessionCount?: number
}

export interface ProjectFile {
  projectId: string
  relativePath: string
  addedAt: string
  title?: string
  category?: string
  excerpt?: string
  missing?: boolean
}

export interface CreateProjectInput {
  name: string
  description?: string
  instructions?: string
  icon?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  instructions?: string
  icon?: string
  color?: string
  archived?: number
}
