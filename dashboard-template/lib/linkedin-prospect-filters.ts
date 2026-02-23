// Pure filtering functions for LinkedIn prospecting — zero API calls

import type { LeadBusiness } from "@/types/lead.types"

export interface ProspectCandidate {
  providerId: string
  name: string
  headline: string
  profileUrl: string
  networkDistance: string
  engagementType: "reaction" | "comment" | "profile_view"
  engagementDetail: string
}

export interface ProspectorResults {
  leadsCreated: number
  candidatesFound: number
  filteredOut: number
  profilesChecked: number
  apiCallsUsed: number
  skippedReasons: Record<string, number>
  leads: Array<{ companyName: string; contactName: string; business: LeadBusiness; id: string }>
  warnings: string[]
  report: string
}

export const API_BUDGET = 50

export const ALLOWED_COUNTRY_CODES = new Set(["US", "CA", "GB", "AU", "NZ"])

const LOCATION_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /\b(United States|USA|U\.S\.)\b/i, code: "US" },
  { pattern: /\b(New York|San Francisco|Los Angeles|Chicago|Austin|Seattle|Boston|Miami|Denver|Atlanta|Dallas|Houston|Portland|Nashville|Phoenix|San Diego|Washington DC)\b/i, code: "US" },
  { pattern: /\b(Canada|Toronto|Vancouver|Montreal|Calgary|Ottawa)\b/i, code: "CA" },
  { pattern: /\b(United Kingdom|UK|London|Manchester|Birmingham|Edinburgh|Bristol|Leeds)\b/i, code: "GB" },
  { pattern: /\b(Australia|Sydney|Melbourne|Brisbane|Perth|Adelaide|Gold Coast)\b/i, code: "AU" },
  { pattern: /\b(New Zealand|Auckland|Wellington|Christchurch)\b/i, code: "NZ" },
]

/* eslint-disable @typescript-eslint/no-explicit-any */

export function isAllowedCountry(locale: any, location: string): boolean {
  if (locale?.primary_locale?.country) {
    return ALLOWED_COUNTRY_CODES.has(locale.primary_locale.country)
  }
  if (locale?.country_code) {
    return ALLOWED_COUNTRY_CODES.has(locale.country_code)
  }
  if (!location) return false
  return LOCATION_PATTERNS.some((p) => p.pattern.test(location))
}

const FOUNDER_PATTERN = /\b(founder|ceo|co-founder|cofounder|owner|managing director|president|cto|coo|chief)\b/i
const EXCLUDE_PATTERN = /\b(student|intern|looking for|seeking|assistant|junior|entry.level)\b/i

export function isLikelyFounder(headline: string): boolean {
  if (!headline) return false
  if (EXCLUDE_PATTERN.test(headline)) return false
  return FOUNDER_PATTERN.test(headline)
}

const AI_COMPANY_PATTERN = /\b(artificial intelligence|machine learning|AI company|AI startup|ai solutions|deep learning|LLM|generative ai|computer vision|neural network)\b/i

export function isAICompany(headline: string, experiences: any[]): boolean {
  if (AI_COMPANY_PATTERN.test(headline)) return true
  for (const exp of experiences || []) {
    const text = `${exp.company_name || ""} ${exp.description || ""} ${exp.title || ""}`
    if (AI_COMPANY_PATTERN.test(text)) return true
  }
  return false
}

const BUSINESS_C_KEYWORDS = /\b(coach|coaching|course creator|online course|cohort|mastermind|training|education|consulting|facilitator|digital products|membership|curriculum|mentor|workshop|webinar|program director)\b/i
const BUSINESS_A_KEYWORDS = /\b(marketing|agency|advertising|ads|lead gen|B2B|sales|growth|demand gen|ecommerce|e-commerce|SaaS|revenue|performance marketing|paid media|media buyer)\b/i

export function categorizeICP(profileText: string): LeadBusiness {
  let businessCScore = 0
  let businessAScore = 0

  const matches = profileText.match(BUSINESS_C_KEYWORDS)
  if (matches) businessCScore += matches.length
  const businessAMatches = profileText.match(BUSINESS_A_KEYWORDS)
  if (businessAMatches) businessAScore += businessAMatches.length

  if (businessCScore > businessAScore && businessCScore > 0) return "Business C"
  return "Business A"
}

export function buildSignalDetail(candidate: ProspectCandidate, postTitle?: string): string {
  const date = new Date().toISOString().split("T")[0]
  if (candidate.engagementType === "reaction") {
    return postTitle
      ? `Liked post "${postTitle.slice(0, 60)}..." on ${date}`
      : `Reacted to post on ${date}`
  }
  if (candidate.engagementType === "comment") {
    return `Commented on post on ${date}: "${candidate.engagementDetail.slice(0, 80)}"`
  }
  return `Viewed profile on ${date}`
}

export function buildNotes(candidate: ProspectCandidate, profile: any): string {
  const parts: string[] = []
  parts.push(`Engagement: ${candidate.engagementType}`)
  if (candidate.headline) parts.push(`Headline: ${candidate.headline}`)
  if (profile?.connections_count) parts.push(`Connections: ${profile.connections_count}`)
  if (profile?.follower_count) parts.push(`Followers: ${profile.follower_count}`)
  return parts.join(" | ")
}

export function buildReport(results: ProspectorResults): string {
  const lines: string[] = ["## LinkedIn Prospector Report\n"]

  lines.push(`**Candidates found:** ${results.candidatesFound}`)
  lines.push(`**Profiles checked:** ${results.profilesChecked}`)
  lines.push(`**Leads created:** ${results.leadsCreated}`)
  lines.push(`**API calls used:** ${results.apiCallsUsed}/${API_BUDGET}`)
  lines.push("")

  if (results.leads.length > 0) {
    lines.push("### New Leads")
    for (const lead of results.leads) {
      lines.push(`- **${lead.contactName}** at ${lead.companyName} → ${lead.business}`)
    }
    lines.push("")
  }

  const reasons = Object.entries(results.skippedReasons)
  if (reasons.length > 0) {
    lines.push("### Filtered Out")
    for (const [reason, count] of reasons) {
      lines.push(`- ${reason}: ${count}`)
    }
    lines.push("")
  }

  if (results.warnings.length > 0) {
    lines.push("### Warnings")
    for (const w of results.warnings) lines.push(`- ${w}`)
  }

  return lines.join("\n")
}
