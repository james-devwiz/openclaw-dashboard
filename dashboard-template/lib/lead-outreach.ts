// Cold outreach principles — hardcoded strategy rules for AI-generated outreach

export const OUTREACH_PRINCIPLES = `## Cold Outreach Principles

### Pipeline Flow
New → Researching → Qualified → Outreach Ready → Contacted → Follow Up → Successful/Unsuccessful

### Core Rules
1. **Micro-lists over mass lists** — campaigns of 50-100 contacts per trigger, never thousands
2. **Trigger-based targeting** — leads must show real-world movement or intent signals
3. **Asset-based offers** — lead with a lead magnet (quiz, blueprint, playbook), never "book a call"
4. **Value before time** — deliver value before asking for their time
5. **One follow-up per channel** — if no response after one follow-up on each platform, mark Unsuccessful

### Omnichannel Strategy (Two-Tier)
- **Tier 1 (highest value):** Email + LinkedIn + Phone — full omnichannel for top prospects
- **Tier 2 (everyone else):** Email first, LinkedIn only if capacity allows

### Email Rules
- Under 40 words total — CEOs get 120 emails/day
- One problem, one solution — lead with value not features
- Plain text only — no HTML, no tracking pixels, no link tracking
- Subject lines under 50 characters — create curiosity not confusion
- Send Tue/Wed/Thu only, 8-10am or 1-3pm local time
- Max 30 emails per inbox per day
- Stop sequence on any reply

### 4-Email Sequence
1. **Initial** — personalised opening line + trigger + asset offer
2. **Quick bump** (2 days) — "just making sure this didn't get buried"
3. **Value add** (2 days) — different angle, case study, or free audit offer
4. **Break-up** (3 days) — "I'll assume this isn't a priority right now"

### LinkedIn Rules
- Profile is a funnel, not a CV — Awareness → Interest → Desire → Action
- Connection note: short, personalised trigger, no pitch
- After connect: thank, reference trigger, ask about their work — DO NOT pitch-slap
- Reserve LinkedIn for highest-value leads (100-200 connections/week limit)

### Personalisation
- Reference something specific about them or their company
- Connect it to a pain point they likely have
- Use enrichment data: LinkedIn headline, recent news, tech stack, job listings
- AI writes personalised opening lines at scale — but each must feel 1:1

### Lead Magnet Strategy
- Our lead magnet is a quiz — low friction, high engagement
- Goal: get them to accept the quiz, then they enter GHL pipeline
- Successful = accepted lead magnet (terminal status, exits our pipeline)
- Unsuccessful = no response after one follow-up per channel (terminal)

### CTA Hierarchy (best to worst)
1. S-Tier: "Would you be against..." / Ask permission to send info
2. A-Tier: "Mind if I share..." / "Is it okay if I send..."
3. B-Tier: "Got a quick 10 min?" / "Interested?"
4. C-Tier (avoid): Links or attachments in first email, "Book a call"

### What NOT to Do
- Never send links or attachments in the first email
- Never pitch in the connection request
- Never use mass lists — micro-lists with triggers only
- Never send on Mondays or Fridays
- Never exceed 30 emails per inbox per day
- Never use HTML templates or tracking pixels`

export const EMAIL_SEQUENCE_TEMPLATES = {
  initial: `Subject: {{trigger_subject}}
Hey {{firstName}},

{{personalised_opening_line_from_trigger}}

{{one_sentence_insight_about_their_pain}}

I put together a quick [quiz/blueprint/playbook] on {{relevant_topic}} — want me to send it over?`,

  bump: `Subject: Re: {{original_subject}}
Hey {{firstName}}, just making sure this didn't get buried.

{{firstName}}, is {{offer_topic}} something worth looking at?`,

  value: `Subject: Re: {{original_subject}}
Hey {{firstName}},

{{different_angle_or_case_study}}

Happy to share more if useful.`,

  breakup: `Subject: Re: {{original_subject}}
Hey {{firstName}},

I'll assume {{offer_topic}} isn't a priority right now. No worries at all.

Feel free to reach out if that changes.`,
}

export const LINKEDIN_MESSAGE_TEMPLATES = {
  connectionNote: `Hey {{firstName}} — saw {{trigger_reference}}. Would love to connect.`,

  firstMessage: `Thanks for connecting, {{firstName}}.

{{trigger_acknowledgement}}

Curious — {{relevant_question_about_their_work}}?`,

  followUp: `Hey {{firstName}}, just circling back.

I put together a quick {{asset_type}} on {{topic}} — thought it might be relevant given {{trigger}}.

Want me to send it over?`,
}

export function getOutreachPrompt(): string {
  return OUTREACH_PRINCIPLES
}
