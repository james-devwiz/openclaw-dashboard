// LinkedIn Prospector -- discovers warm leads from post engagement + profile viewers

import { getUnipile, getAccountId } from "./unipile"
import { getDb } from "./db"
import { createLead } from "./db-leads"
import {
  API_BUDGET, isLikelyFounder, isAllowedCountry, isAICompany,
  categorizeICP, buildSignalDetail, buildNotes, buildReport,
  type ProspectCandidate, type ProspectorResults,
} from "./linkedin-prospect-filters"
import {
  fetchYesterdayPost, fetchEngagementCandidates, extractIdentifier,
} from "./linkedin-prospect-engagement"

/* eslint-disable @typescript-eslint/no-explicit-any */

const OWN_ID = process.env.LINKEDIN_OWN_IDENTIFIER || ""

function isExistingLead(profileUrl: string): boolean {
  const db = getDb()
  const row = db.prepare("SELECT id FROM leads WHERE linkedinUrl = ?").get(profileUrl)
  return !!row
}

function isExistingThread(profileUrl: string): boolean {
  const db = getDb()
  const row = db.prepare("SELECT id FROM linkedin_threads WHERE participantProfileUrl = ?").get(profileUrl)
  return !!row
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function runLinkedInProspector(): Promise<ProspectorResults> {
  const client = getUnipile()
  const accountId = getAccountId()
  let apiCallsUsed = 0
  const warnings: string[] = []
  const skipped: Record<string, number> = {}
  const skip = (reason: string) => { skipped[reason] = (skipped[reason] || 0) + 1 }

  if (!OWN_ID) throw new Error("LINKEDIN_OWN_IDENTIFIER not set")

  // Phase 1: Get yesterday's post
  const postResult = await fetchYesterdayPost(OWN_ID)
  apiCallsUsed += postResult.apiCallsUsed
  warnings.push(...postResult.warnings)

  // Phase 2-4: Get reactions, comments, profile viewers
  const engResult = await fetchEngagementCandidates(postResult.postId)
  apiCallsUsed += engResult.apiCallsUsed
  warnings.push(...engResult.warnings)
  const candidates = engResult.candidates

  // Phase 5: Pre-filter (0 API calls)
  const preFiltered: ProspectCandidate[] = []
  for (const c of candidates.values()) {
    if (c.networkDistance && !c.networkDistance.includes("SECOND")) { skip("Not 2nd degree"); continue }
    if (!isLikelyFounder(c.headline)) { skip("Not founder/CEO"); continue }
    if (isExistingLead(c.profileUrl)) { skip("Already a lead"); continue }
    if (isExistingThread(c.profileUrl)) { skip("Existing DM contact"); continue }
    preFiltered.push(c)
  }

  // Phase 6: Full profile lookups (capped)
  const maxLookups = Math.max(0, API_BUDGET - apiCallsUsed)
  const toCheck = preFiltered.slice(0, maxLookups)
  if (preFiltered.length > maxLookups) {
    warnings.push(`Budget cap: checking ${maxLookups} of ${preFiltered.length} candidates`)
  }

  const createdLeads: ProspectorResults["leads"] = []
  let profilesChecked = 0

  for (const candidate of toCheck) {
    const identifier = extractIdentifier(candidate.profileUrl) || candidate.providerId
    if (!identifier) { skip("No identifier"); continue }

    try {
      const profile: any = await client.users.getProfile({ account_id: accountId, identifier })
      apiCallsUsed++
      profilesChecked++
      await sleep(500)

      if (!isAllowedCountry(profile, profile?.location || "")) { skip("Outside target countries"); continue }
      const experiences = profile?.work_experience || profile?.experience || []
      if (isAICompany(candidate.headline, experiences)) { skip("AI company (competitor)"); continue }

      const profileText = [
        candidate.headline,
        profile?.summary || "",
        ...experiences.map((e: any) => `${e.company_name || ""} ${e.title || ""} ${e.description || ""}`),
      ].join(" ")

      const business = categorizeICP(profileText)
      const companyName = experiences[0]?.company_name || "Unknown Company"
      const location = profile?.location || ""

      const lead = createLead({
        companyName,
        contactName: candidate.name || profile?.name || "",
        contactTitle: candidate.headline,
        linkedinUrl: candidate.profileUrl,
        location,
        business,
        source: "LinkedIn",
        status: "New",
        priority: "Medium",
        signalType: "linkedin_engagement",
        signalDetail: buildSignalDetail(candidate, postResult.postTitle),
        notes: buildNotes(candidate, profile),
        tags: "linkedin-prospector",
      })

      createdLeads.push({ companyName, contactName: lead.contactName, business, id: lead.id })
    } catch (err: any) {
      warnings.push(`Profile lookup failed for ${identifier}: ${err.message}`)
    }
  }

  const results: ProspectorResults = {
    leadsCreated: createdLeads.length,
    candidatesFound: candidates.size,
    filteredOut: candidates.size - preFiltered.length,
    profilesChecked,
    apiCallsUsed,
    skippedReasons: skipped,
    leads: createdLeads,
    warnings,
    report: "",
  }
  results.report = buildReport(results)
  return results
}
