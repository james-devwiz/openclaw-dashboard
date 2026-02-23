export type AgentType = "main" | "contextual" | "sub"
export type SkillStatus = "ready" | "missing" | "disabled"

export interface SkillInstallSpec {
  id: string
  kind: string
  label: string
  bins: string[]
  module?: string
  formula?: string
  url?: string
  package?: string
  available: boolean
}

export interface AgentDefinition {
  id: string
  name: string
  type: AgentType
  description: string
  businesses: string[]
  skills: string[] // skill names; empty = all
  systemPrompt?: string
}

export interface BusinessDefinition {
  id: string
  name: string
  description: string
  colour: string
}

export interface SkillMissing {
  bins: string[]
  anyBins: string[]
  env: string[]
  config: string[]
  os: string[]
}

export interface SkillInfo {
  name: string
  emoji: string
  status: SkillStatus
  description: string
  source: string
  homepage?: string
  missing: SkillMissing
  disabled: boolean
  install: SkillInstallSpec[]
}

export interface AgentLiveData {
  model: string
  fallbacks: string[]
  heartbeat: { enabled: boolean; interval: number }
}

export interface AgentWithLiveData extends AgentDefinition {
  live: AgentLiveData | null
  readySkillCount: number
  totalSkillCount: number
}

export interface ModelInfo {
  id: string
  alias: string
  label: string
  provider: string
  isPrimary: boolean
  isFallback: boolean
  isHeartbeat: boolean
  disabled: boolean
}

export interface ArchitectureData {
  agents: AgentWithLiveData[]
  skills: SkillInfo[]
  businesses: BusinessDefinition[]
  models: ModelInfo[]
}

// ReactFlow node data types
export interface AgentNodeData {
  agent: AgentWithLiveData
}

export interface BusinessNodeData {
  business: BusinessDefinition
}

export interface SkillDetail {
  name: string
  content: string
  source: string
  filePath: string
}

export interface SkillGroupNodeData {
  agentId: string
  skills: SkillInfo[]
}

export interface ModelDetailAgent {
  id: string
  name: string
}

export interface ModelDetailCronJob {
  name: string
  schedule: string
}

export interface ModelDetail {
  id: string
  alias: string
  provider: string
  role: string
  agents: ModelDetailAgent[]
  cronJobs: ModelDetailCronJob[]
  topics: string[]
  isHeartbeat: boolean
}
