// Ideal Customer Profiles for each business entity

import type { LeadBusiness } from "@/types/lead.types"

export interface ICP {
  business: LeadBusiness
  description: string
  industries: string[]
  minRevenue: number
  currency: string
  keywords: string[]
  excludeKeywords: string[]
}

export const ICPS: Record<LeadBusiness, ICP> = {
  "Business C": {
    business: "Business C",
    description: "Online entrepreneurs providing B2B business education services — coaching, consulting, cohort programs, online courses, digital products",
    industries: [
      "Business Coaching", "Business Consulting", "Online Courses",
      "Digital Products", "Cohort Programs", "Executive Coaching",
    ],
    minRevenue: 1_000_000,
    currency: "USD",
    keywords: [
      "business coaching", "executive coaching", "online course creator",
      "cohort-based course", "digital products", "B2B education",
      "business consulting", "group coaching program",
    ],
    excludeKeywords: ["B2C", "kids education", "K-12", "university", "academic"],
  },
  "Business A": {
    business: "Business A",
    description: "B2B businesses generating $1M+/year that need automation services. Also includes marketing agencies",
    industries: [
      "B2B Services", "Marketing Agency", "Digital Agency",
      "Professional Services", "SaaS", "E-commerce B2B",
    ],
    minRevenue: 1_000_000,
    currency: "USD",
    keywords: [
      "B2B", "running ads", "paid advertising", "Google Ads", "Facebook Ads",
      "marketing agency", "digital agency", "lead generation", "ad spend",
    ],
    excludeKeywords: ["B2C retail", "consumer goods"],
  },
  "Business B": {
    business: "Business B",
    description: "Entrepreneurs and companies building SaaS products — especially AI SaaS. Includes existing SaaS adding AI features, and entrepreneurs looking to build new SaaS",
    industries: [
      "SaaS", "AI SaaS", "Software Development", "Tech Startup",
      "Enterprise Software",
    ],
    minRevenue: 0,
    currency: "USD",
    keywords: [
      "SaaS", "AI SaaS", "build SaaS", "software product", "AI features",
      "MVP", "tech startup", "AI startup", "no-code SaaS", "micro-SaaS",
    ],
    excludeKeywords: ["freelance developer", "web design only"],
  },
}

export function getICPPrompt(business?: LeadBusiness): string {
  if (business && ICPS[business]) {
    const icp = ICPS[business]
    return formatICP(icp)
  }

  return Object.values(ICPS).map(formatICP).join("\n\n")
}

function formatICP(icp: ICP): string {
  const rev = icp.minRevenue > 0
    ? `$${(icp.minRevenue / 1_000_000).toFixed(0)}M+ ${icp.currency}/year`
    : "Any stage"
  return `### ${icp.business}
- **Target:** ${icp.description}
- **Industries:** ${icp.industries.join(", ")}
- **Revenue:** ${rev}
- **Keywords:** ${icp.keywords.join(", ")}
- **Exclude:** ${icp.excludeKeywords.join(", ")}`
}
