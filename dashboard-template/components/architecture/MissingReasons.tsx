import type { SkillInfo } from "@/types/index"

export default function MissingReasons({ skill }: { skill: SkillInfo }) {
  const m = skill.missing
  const reasons: string[] = []
  if (m.bins.length) reasons.push(`Binaries: ${m.bins.join(", ")}`)
  if (m.anyBins.length) reasons.push(`Any binary: ${m.anyBins.join(", ")}`)
  if (m.env.length) reasons.push(`Env vars: ${m.env.join(", ")}`)
  if (m.config.length) reasons.push(`Config: ${m.config.join(", ")}`)
  if (m.os.length) reasons.push(`OS: ${m.os.join(", ")}`)
  if (!reasons.length) return null
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-red-600 dark:text-red-400">Missing requirements:</span>
      {reasons.map((r) => (
        <p key={r} className="text-xs text-muted-foreground">{r}</p>
      ))}
    </div>
  )
}
