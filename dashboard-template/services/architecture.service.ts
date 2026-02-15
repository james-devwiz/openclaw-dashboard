import type { ArchitectureData, SkillDetail, SkillInstallSpec } from "@/types/index"

export async function getArchitectureApi(): Promise<ArchitectureData> {
  const res = await fetch("/api/architecture")
  if (!res.ok) throw new Error(`Architecture fetch failed: ${res.status}`)
  return res.json()
}

export async function getSkillDetail(name: string): Promise<SkillDetail> {
  const res = await fetch(`/api/architecture/skills/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`Skill detail fetch failed: ${res.status}`)
  return res.json()
}

export async function toggleSkill(name: string, enabled: boolean): Promise<void> {
  const res = await fetch(`/api/architecture/skills/${encodeURIComponent(name)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) throw new Error(`Skill toggle failed: ${res.status}`)
}

export async function getSkillInstallSpecs(name: string): Promise<SkillInstallSpec[]> {
  const res = await fetch(`/api/architecture/skills/${encodeURIComponent(name)}/install`)
  if (!res.ok) throw new Error(`Install specs fetch failed: ${res.status}`)
  const data = await res.json()
  return data.specs
}

export async function installSkill(name: string, installId: string): Promise<{ message: string }> {
  const res = await fetch(`/api/architecture/skills/${encodeURIComponent(name)}/install`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ installId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Install failed" }))
    throw new Error(err.error || `Install failed: ${res.status}`)
  }
  return res.json()
}
