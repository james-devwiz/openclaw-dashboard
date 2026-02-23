export type LeadStatus =
  | "New" | "Researching" | "Qualified" | "Outreach Ready"
  | "LinkedIn Request" | "Email" | "Call" | "Follow-up Ready" | "Follow Up"
  | "Successful" | "Unsuccessful" | "Archived"
  | "Contacted" // deprecated — kept for existing data

export type CallOutcome = "connected" | "voicemail" | "no-answer" | "declined" | ""

export type LeadPriority = "High" | "Medium" | "Low"
export type LeadSource = "Manual" | "Bright Data" | "Apollo" | "Cron" | "Referral" | "Import" | "LinkedIn"
export type LeadBusiness = "Business A" | "Business B" | "Business C"

export interface Lead {
  id: string
  companyName: string
  contactName: string
  contactTitle: string
  email: string
  emailVerified: string
  phone: string
  website: string
  linkedinUrl: string
  location: string
  industry: string
  companySize: string
  estimatedRevenue: string
  status: LeadStatus
  business: LeadBusiness
  priority: LeadPriority
  score: number
  source: LeadSource
  companyData: string
  enrichmentData: string
  notes: string
  nextAction: string
  nextActionDate?: string
  lastContactedAt?: string
  goalId?: string
  signalType: string
  signalDetail: string
  tags: string
  logoUrl: string
  outreachDrafts: string
  researchSummary: string
  callOutcome: CallOutcome
  callNotes: string
  followUpDrafts: string
  linkedinConnected: boolean
  createdAt: string
  updatedAt: string
}

export type LeadActivityType = "note" | "call" | "email" | "linkedin" | "meeting" | "research" | "status_change"

export interface LeadActivity {
  id: string
  leadId: string
  activityType: LeadActivityType
  content: string
  outcome: string
  createdAt: string
}

export interface LeadStats {
  total: number
  qualified: number
  contactedThisWeek: number
  hotLeads: number
  avgScore: number
}
